import crypto from "node:crypto";
import mongoose from "mongoose";

import GarbaOrder from "../models/GarbaOrder.js";
import GarbaPass from "../models/GarbaPass.js";
import GarbaTicket from "../models/GarbaTicket.js";

const generateTicketNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = crypto.randomBytes(4).toString("hex");

  return `GPT${timestamp}${random}`;
};

const generateQrToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const completeRazorpayPayment = async ({
  razorpayOrderId,
  razorpayPaymentId,
  paymentAmount,
}) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await GarbaOrder.findOne({
      paymentOrderId: razorpayOrderId,
    }).session(session);

    if (!order) {
      throw new Error(`Order not found for Razorpay order ${razorpayOrderId}`);
    }

    if (order.paymentStatus === "PAID") {
      if (order.paymentId !== razorpayPaymentId) {
        throw new Error(`Order ${order.orderNumber} was paid with another payment`);
      }

      await session.commitTransaction();
      return order;
    }

    if (order.paymentStatus !== "PROCESSING") {
      throw new Error(`Order ${order.orderNumber} is not processing payment`);
    }

    const expectedAmount = Math.round(order.totalAmount * 100);

    if (paymentAmount !== expectedAmount) {
      throw new Error(`Payment amount mismatch for ${order.orderNumber}`);
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
    order.paymentId = razorpayPaymentId;
    order.paidAt = new Date();
    order.paymentGateway = "RAZORPAY";

    await order.save({ session });

    for (const item of order.items) {
      const pass = await GarbaPass.findOneAndUpdate(
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

      if (!pass) {
        throw new Error(`Reserved inventory missing for pass ${item.pass}`);
      }

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

    await session.commitTransaction();

    console.log(`✅ Order ${order.orderNumber} marked PAID`);
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
