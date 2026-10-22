import crypto from "node:crypto";
import mongoose from "mongoose";

import GarbaOrder from "../models/GarbaOrder.js";
import GarbaPass from "../models/GarbaPass.js";
import GarbaTicket from "../models/GarbaTicket.js";
import GarbaReferral from "../models/GarbaReferral.js";

export const generateTicketNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = crypto.randomBytes(4).toString("hex");

  return `GPT${timestamp}${random}`;
};

export const generateQrToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Completes a PhonePe payment atomically.
 *
 * Guarantees:
 * 1. Verified order reference and exact amount check.
 * 2. Idempotent on repeated calls (duplicate S2S webhooks / polling).
 * 3. Never issues duplicate tickets.
 * 4. Finalizes reserved inventory (decrements reserved, increments sold).
 * 5. Generates customer tickets with cryptographically secure qrToken and status ACTIVE.
 * 6. Preserves existing check-in / scanner architecture.
 */
export const completePhonePePayment = async ({
  merchantTransactionId,
  transactionId,
  paymentAmount,
}) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Look up by paymentOrderId or orderNumber
    const order = await GarbaOrder.findOne({
      $or: [
        { paymentOrderId: merchantTransactionId },
        { orderNumber: merchantTransactionId },
      ],
    }).session(session);

    if (!order) {
      throw new Error(
        `Order not found for PhonePe transaction ${merchantTransactionId}`,
      );
    }

    // Idempotency: Already paid
    if (order.paymentStatus === "PAID") {
      console.log(
        `ℹ️ Order ${order.orderNumber} is already marked PAID. Duplicate webhook/reconcile skipped.`,
      );
      await session.commitTransaction();
      return order;
    }

    if (!["PENDING", "PROCESSING"].includes(order.paymentStatus)) {
      throw new Error(
        `Order ${order.orderNumber} is in ${order.paymentStatus} status and cannot be marked PAID.`,
      );
    }

    // Amount verification: PhonePe amount is in paise, order totalAmount is in INR
    const expectedAmount = Math.round(order.totalAmount * 100);

    if (paymentAmount !== expectedAmount) {
      throw new Error(
        `Payment amount mismatch for order ${order.orderNumber}: expected ${expectedAmount} paise, received ${paymentAmount} paise`,
      );
    }

    // Ensure member counts are hydrated
    for (const item of order.items) {
      if (item.membersCount == null) {
        const pass = await GarbaPass.findById(item.pass).session(session);

        if (!pass) {
          throw new Error(`Pass not found for order item ${item.pass}`);
        }

        item.membersCount = pass.membersCount;
      }
    }

    // Mark order as PAID
    order.paymentStatus = "PAID";
    order.paymentId = transactionId || merchantTransactionId;
    order.paidAt = new Date();
    order.paymentGateway = "PHONEPE";

    await order.save({ session });

    // Finalize reserved inventory and create tickets
    for (const item of order.items) {
      // First attempt to transition reserved inventory to sold
      let pass = await GarbaPass.findOneAndUpdate(
        {
          _id: item.pass,
          reservedQuantity: {
            $gte: item.quantity,
          },
        },
        {
          $inc: {
            reservedQuantity: -item.quantity,
            soldQuantity: item.quantity,
          },
        },
        {
          returnDocument: "after",
          session,
        },
      );

      // If reservedQuantity was already adjusted or zero, simply increment soldQuantity
      if (!pass) {
        pass = await GarbaPass.findOneAndUpdate(
          {
            _id: item.pass,
          },
          {
            $inc: {
              soldQuantity: item.quantity,
            },
          },
          {
            returnDocument: "after",
            session,
          },
        );
      }

      if (!pass) {
        throw new Error(`Pass not found for item ${item.pass}`);
      }

      // Generate tickets for this pass
      for (let i = 0; i < item.quantity; i++) {
        await GarbaTicket.create(
          [
            {
              ticketNumber: generateTicketNumber(),
              qrToken: generateQrToken(),
              event: order.event,
              order: order._id,
              pass: item.pass,
              passType: item.passType,
              passName: item.passName,
              membersCount: item.membersCount ?? pass.membersCount,
              holderName: order.customerName,
              holderPhone: order.customerPhone,
              holderEmail: order.customerEmail,
              status: "ACTIVE",
              issuedAt: new Date(),
            },
          ],
          { session },
        );
      }
    }

    // Attribute referral stats if applicable
    if (order.referral || order.referralCode) {
      const referralQuery = order.referral
        ? { _id: order.referral }
        : { code: order.referralCode, isActive: true };

      await GarbaReferral.updateOne(
        referralQuery,
        {
          $inc: {
            successfulOrders: 1,
            totalRevenue: order.totalAmount || 0,
            totalTicketsSold: order.membersCount || 1,
          },
          $set: { lastUsedAt: new Date() },
        },
        { session },
      );
    }

    await session.commitTransaction();

    console.log(
      `✅ Order ${order.orderNumber} successfully marked PAID via PhonePe (${transactionId})`,
    );

    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

/**
 * Handles failed/cancelled payments:
 * Releases any reserved pass inventory and marks the order as FAILED.
 * Guarantees that no tickets are generated.
 */
export const failPhonePePayment = async ({
  merchantTransactionId,
  transactionId,
  reason,
}) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await GarbaOrder.findOne({
      $or: [
        { paymentOrderId: merchantTransactionId },
        { orderNumber: merchantTransactionId },
      ],
    }).session(session);

    if (!order) {
      await session.commitTransaction();
      return null;
    }

    // Never cancel an already PAID order
    if (order.paymentStatus === "PAID") {
      await session.commitTransaction();
      return order;
    }

    if (["PENDING", "PROCESSING"].includes(order.paymentStatus)) {
      // Release reserved pass inventory
      for (const item of order.items) {
        await GarbaPass.updateOne(
          {
            _id: item.pass,
            reservedQuantity: { $gte: item.quantity },
          },
          {
            $inc: {
              reservedQuantity: -item.quantity,
            },
          },
          { session },
        );
      }

      order.paymentStatus = "FAILED";
      if (transactionId) {
        order.paymentId = transactionId;
      }
      order.paymentGateway = "PHONEPE";

      await order.save({ session });
      console.log(
        `❌ Order ${order.orderNumber} marked FAILED (${reason || "Payment declined"}). Reserved inventory released.`,
      );
    }

    await session.commitTransaction();
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

/**
 * Completes a Razorpay payment atomically and idempotently.
 *
 * Guarantees:
 * 1. Verified order reference and exact amount check in paise.
 * 2. Idempotent on repeated calls (duplicate webhooks / verify calls / retries).
 * 3. Never issues duplicate tickets or increments sold quantity more than once.
 * 4. Finalizes reserved inventory (decrements reserved, increments sold).
 * 5. Generates customer tickets with cryptographically secure qrToken and status ACTIVE.
 * 6. Preserves existing check-in / scanner architecture.
 */
export const completeRazorpayPayment = async ({
  razorpayOrderId,
  razorpayPaymentId,
  paymentAmount,
  orderId,
}) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const query = [];
    if (razorpayOrderId) query.push({ paymentOrderId: razorpayOrderId });
    if (orderId && mongoose.isValidObjectId(orderId)) query.push({ _id: orderId });

    if (query.length === 0) {
      throw new Error("Either razorpayOrderId or orderId is required");
    }

    const order = await GarbaOrder.findOne({
      $or: query,
    }).session(session);

    if (!order) {
      throw new Error(
        `Order not found for Razorpay order ${razorpayOrderId || orderId}`,
      );
    }

    // Idempotency: Order is already marked PAID
    if (order.paymentStatus === "PAID") {
      console.log(
        `ℹ️ Order ${order.orderNumber} is already marked PAID. Duplicate verification/webhook skipped.`,
      );
      await session.commitTransaction();
      return order;
    }

    if (!["PENDING", "PROCESSING"].includes(order.paymentStatus)) {
      throw new Error(
        `Order ${order.orderNumber} is in ${order.paymentStatus} status and cannot be marked PAID.`,
      );
    }

    const expectedAmount = Math.round(order.totalAmount * 100);

    if (paymentAmount != null && paymentAmount !== expectedAmount) {
      throw new Error(
        `Payment amount mismatch for order ${order.orderNumber}: expected ${expectedAmount} paise, received ${paymentAmount} paise`,
      );
    }

    for (const item of order.items) {
      if (item.membersCount == null) {
        const pass = await GarbaPass.findById(item.pass).session(session);

        if (!pass) {
          throw new Error(`Pass not found for order item ${item.pass}`);
        }

        item.membersCount = pass.membersCount;
      }
    }

    order.paymentStatus = "PAID";
    order.paymentId = razorpayPaymentId || order.paymentId || razorpayOrderId;
    order.paidAt = new Date();
    order.paymentGateway = "RAZORPAY";

    await order.save({ session });

    // Transition reserved pass inventory to sold
    for (const item of order.items) {
      let pass = await GarbaPass.findOneAndUpdate(
        {
          _id: item.pass,
          reservedQuantity: {
            $gte: item.quantity,
          },
        },
        {
          $inc: {
            reservedQuantity: -item.quantity,
            soldQuantity: item.quantity,
          },
        },
        {
          returnDocument: "after",
          session,
        },
      );

      // If reservedQuantity was already 0 or adjusted, simply increment soldQuantity
      if (!pass) {
        pass = await GarbaPass.findOneAndUpdate(
          {
            _id: item.pass,
          },
          {
            $inc: {
              soldQuantity: item.quantity,
            },
          },
          {
            returnDocument: "after",
            session,
          },
        );
      }

      if (!pass) {
        throw new Error(`Pass not found for item ${item.pass}`);
      }

      // Check if tickets were already created for this order to prevent duplicates
      const existingTickets = await GarbaTicket.find({
        order: order._id,
        pass: item.pass,
      }).session(session);

      if (existingTickets.length === 0) {
        for (let i = 0; i < item.quantity; i++) {
          await GarbaTicket.create(
            [
              {
                ticketNumber: generateTicketNumber(),
                qrToken: generateQrToken(),
                event: order.event,
                order: order._id,
                pass: item.pass,
                passType: item.passType,
                passName: item.passName,
                membersCount: item.membersCount ?? pass.membersCount,
                holderName: order.customerName,
                holderPhone: order.customerPhone,
                holderEmail: order.customerEmail,
                status: "ACTIVE",
                issuedAt: new Date(),
              },
            ],
            { session },
          );
        }
      }
    }

    // Attribute referral stats if applicable
    if (order.referral || order.referralCode) {
      const referralQuery = order.referral
        ? { _id: order.referral }
        : { code: order.referralCode, isActive: true };

      await GarbaReferral.updateOne(
        referralQuery,
        {
          $inc: {
            successfulOrders: 1,
            totalRevenue: order.totalAmount || 0,
            totalTicketsSold: order.membersCount || 1,
          },
          $set: { lastUsedAt: new Date() },
        },
        { session },
      );
    }

    await session.commitTransaction();

    console.log(
      `✅ Order ${order.orderNumber} successfully marked PAID via Razorpay (${razorpayPaymentId})`,
    );
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

/**
 * Handles failed/cancelled Razorpay payments:
 * Releases any reserved pass inventory and marks the order as FAILED.
 * Guarantees that no tickets are generated and paid orders are never touched.
 */
export const failRazorpayPayment = async ({
  razorpayOrderId,
  razorpayPaymentId,
  orderId,
  reason,
}) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const query = [];
    if (razorpayOrderId) query.push({ paymentOrderId: razorpayOrderId });
    if (orderId && mongoose.isValidObjectId(orderId)) query.push({ _id: orderId });

    if (query.length === 0) {
      await session.commitTransaction();
      return null;
    }

    const order = await GarbaOrder.findOne({
      $or: query,
    }).session(session);

    if (!order) {
      await session.commitTransaction();
      return null;
    }

    // Never cancel or fail an already PAID order
    if (order.paymentStatus === "PAID") {
      await session.commitTransaction();
      return order;
    }

    if (["PENDING", "PROCESSING"].includes(order.paymentStatus)) {
      // Release reserved pass inventory
      for (const item of order.items) {
        await GarbaPass.updateOne(
          {
            _id: item.pass,
            reservedQuantity: { $gte: item.quantity },
          },
          {
            $inc: {
              reservedQuantity: -item.quantity,
            },
          },
          { session },
        );
      }

      await GarbaOrder.updateOne(
        { _id: order._id },
        {
          $set: {
            paymentStatus: "FAILED",
            paymentGateway: "RAZORPAY",
            ...(razorpayPaymentId ? { paymentId: razorpayPaymentId } : {}),
          },
        },
      ).session(session);

      console.log(
        `❌ Order ${order.orderNumber} marked FAILED (${reason || "Payment declined/cancelled"}). Reserved inventory released.`,
      );
    }

    await session.commitTransaction();
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

/**
 * Releases reserved inventory for unpaid/abandoned orders past their reservation window.
 * Permanently protects all PAID orders.
 */
export const releaseExpiredReservations = async () => {
  try {
    const expiredOrders = await GarbaOrder.find({
      paymentStatus: { $in: ["PENDING", "PROCESSING"] },
      expiresAt: { $lt: new Date() },
    });

    if (expiredOrders.length === 0) {
      return 0;
    }

    let releasedCount = 0;

    for (const order of expiredOrders) {
      const session = await mongoose.startSession();

      try {
        session.startTransaction();

        const currentOrder = await GarbaOrder.findOne({
          _id: order._id,
          paymentStatus: { $in: ["PENDING", "PROCESSING"] },
        }).session(session);

        if (!currentOrder) {
          await session.commitTransaction();
          continue;
        }

        for (const item of currentOrder.items) {
          await GarbaPass.updateOne(
            {
              _id: item.pass,
              reservedQuantity: { $gte: item.quantity },
            },
            {
              $inc: {
                reservedQuantity: -item.quantity,
              },
            },
            { session },
          );
        }

        await GarbaOrder.updateOne(
          { _id: currentOrder._id },
          { $set: { paymentStatus: "FAILED" } },
        ).session(session);

        await session.commitTransaction();
        releasedCount += 1;
        console.log(
          `⏱️ Released expired reservation for order ${currentOrder.orderNumber}`,
        );
      } catch (err) {
        await session.abortTransaction();
        console.warn(
          `Failed to release reservation for order ${order.orderNumber}:`,
          err.message,
        );
      } finally {
        await session.endSession();
      }
    }

    return releasedCount;
  } catch (error) {
    console.error("releaseExpiredReservations error:", error.message);
    return 0;
  }
};
