import mongoose from "mongoose";

import GarbaOrder from "../models/GarbaOrder.js";
import {
  createRazorpayOrder,
  getRazorpayKeyId,
  verifyRazorpayCheckoutSignature,
  fetchRazorpayPayment,
  captureRazorpayPayment,
  fetchRazorpayOrderPayments,
} from "../services/razorpayService.js";
import {
  completeRazorpayPayment,
  failRazorpayPayment,
} from "../services/paymentCompletionService.js";

const toOrderResponse = (order) => ({
  _id: order._id,
  orderNumber: order.orderNumber,
  paymentStatus: order.paymentStatus,
  totalAmount: order.totalAmount,
  paymentOrderId: order.paymentOrderId,
  paymentId: order.paymentId,
  paymentGateway: order.paymentGateway,
  paidAt: order.paidAt,
});

/**
 * Creates/initiates a Razorpay payment order for a GarbaPass order.
 * Endpoint: POST /api/payments/create-order (or /api/create-order)
 */
export const createPaymentOrder = async (req, res) => {
  try {
    const { orderId, amount, currency, receipt } = req.body;

    let order = null;

    if (orderId) {
      if (!mongoose.isValidObjectId(orderId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid orderId",
        });
      }

      order = await GarbaOrder.findById(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Check if order reservation has expired
      if (order.expiresAt && new Date() >= order.expiresAt) {
        if (["PENDING", "PROCESSING"].includes(order.paymentStatus)) {
          await failRazorpayPayment({
            orderId: order._id,
            reason: "Reservation expired",
          });
        }

        return res.status(400).json({
          success: false,
          message: "Order has expired. Please select your pass again.",
        });
      }

      // Check if order was already paid
      if (order.paymentStatus === "PAID") {
        return res.status(400).json({
          success: false,
          message: "Order has already been paid",
        });
      }
    }

    // Determine amount in paise
    const amountInPaise = order
      ? Math.round(order.totalAmount * 100)
      : Math.round(Number(amount));

    if (!amountInPaise || amountInPaise < 100) {
      return res.status(400).json({
        success: false,
        message: "Amount must be at least 100 paise (₹1)",
      });
    }

    const orderCurrency = currency || "INR";
    const receiptId = order ? order.orderNumber : receipt || `REC-${Date.now()}`;

    // If order already has an active Razorpay order in PROCESSING, return it
    if (
      order &&
      order.paymentOrderId &&
      order.paymentStatus === "PROCESSING"
    ) {
      return res.status(200).json({
        success: true,
        message: "Active Razorpay order retrieved",
        data: {
          order_id: order.paymentOrderId,
          razorpayOrderId: order.paymentOrderId,
          amount: amountInPaise,
          currency: orderCurrency,
          keyId: getRazorpayKeyId(),
          orderId: order._id,
          orderNumber: order.orderNumber,
          gateway: "RAZORPAY",
        },
      });
    }

    // Create a new order on Razorpay
    const razorpayOrder = await createRazorpayOrder({
      amount: amountInPaise,
      currency: orderCurrency,
      receipt: receiptId,
      notes: order
        ? {
            garbaOrderId: String(order._id),
            orderNumber: order.orderNumber,
            customerPhone: order.customerPhone,
            customerName: order.customerName,
          }
        : {},
    });

    if (order) {
      order.paymentGateway = "RAZORPAY";
      order.paymentOrderId = razorpayOrder.id;
      order.paymentStatus = "PROCESSING";
      await order.save();
    }

    return res.status(201).json({
      success: true,
      message: "Razorpay order created successfully",
      data: {
        order_id: razorpayOrder.id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || "INR",
        keyId: getRazorpayKeyId(),
        orderId: order?._id,
        orderNumber: order?.orderNumber,
        gateway: "RAZORPAY",
      },
    });
  } catch (error) {
    console.error("Create payment order error:", error);

    const statusCode = error.statusCode || 500;
    const message =
      error.error?.description ||
      error.message ||
      "Failed to initiate Razorpay payment";

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

/**
 * Verifies Razorpay payment signature and marks order PAID after complete server-side verification.
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * Endpoint: POST /api/payments/verify (or /api/verify-payment)
 */
export const verifyPayment = async (req, res) => {
  try {
    const orderId = req.body.orderId || req.body.garbaOrderId;
    const razorpayOrderId =
      req.body.razorpay_order_id || req.body.order_id || req.body.razorpayOrderId;
    const razorpayPaymentId =
      req.body.razorpay_payment_id || req.body.payment_id || req.body.razorpayPaymentId;
    const razorpaySignature =
      req.body.razorpay_signature || req.body.signature || req.body.razorpaySignature;

    // Validate required fields
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Missing required Razorpay payment verification fields",
      });
    }

    // Step 1: Verify HMAC-SHA256 Signature using Razorpay Secret Key
    const isSignatureValid = verifyRazorpayCheckoutSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isSignatureValid) {
      console.warn(
        `❌ Signature verification failed for Razorpay order ${razorpayOrderId}`,
      );
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay payment signature",
      });
    }

    // Step 2: Locate the GarbaPass Order
    let order = null;
    if (orderId && mongoose.isValidObjectId(orderId)) {
      order = await GarbaOrder.findById(orderId);
    } else {
      order = await GarbaOrder.findOne({ paymentOrderId: razorpayOrderId });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found for this payment",
      });
    }

    // Idempotency: If order was already confirmed PAID, return existing order
    if (order.paymentStatus === "PAID") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        data: { order: toOrderResponse(order) },
      });
    }

    // Ensure Razorpay Order ID matches the GarbaPass order
    if (order.paymentOrderId && order.paymentOrderId !== razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order ID does not match this GarbaPass order",
      });
    }

    // Step 3: Server-side Verification against Razorpay Payments API
    const payment = await fetchRazorpayPayment(razorpayPaymentId);

    if (!payment) {
      return res.status(400).json({
        success: false,
        message: "Payment record not found on Razorpay",
      });
    }

    if (payment.order_id !== razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: "Payment entity order ID mismatch",
      });
    }

    const expectedAmountPaise = Math.round(order.totalAmount * 100);

    if (payment.amount !== expectedAmountPaise) {
      return res.status(400).json({
        success: false,
        message: `Payment amount mismatch: expected ${expectedAmountPaise} paise, received ${payment.amount} paise`,
      });
    }

    let finalPayment = payment;

    // Capture authorized payment if needed
    if (finalPayment.status === "authorized") {
      finalPayment = await captureRazorpayPayment(
        finalPayment.id,
        expectedAmountPaise,
        "INR",
      );
    }

    if (finalPayment.status !== "captured") {
      return res.status(400).json({
        success: false,
        message: `Payment not captured (current status: ${finalPayment.status})`,
      });
    }

    // Step 4: Atomically complete order, finalize inventory, and generate ticket
    const completedOrder = await completeRazorpayPayment({
      razorpayOrderId,
      razorpayPaymentId: finalPayment.id,
      paymentAmount: finalPayment.amount,
      orderId: order._id,
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        order: toOrderResponse(completedOrder || order),
      },
    });
  } catch (error) {
    console.error("Verify payment error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify payment",
    });
  }
};

/**
 * Reconciles payment status against Razorpay API for page refreshes / reconnection.
 */
export const reconcilePayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId || !mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "A valid orderId is required",
      });
    }

    const order = await GarbaOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // If already confirmed PAID, return immediately
    if (order.paymentStatus === "PAID") {
      return res.status(200).json({
        success: true,
        data: { order: toOrderResponse(order) },
      });
    }

    // If order has an active Razorpay Order ID, query Razorpay
    if (order.paymentOrderId && ["PENDING", "PROCESSING"].includes(order.paymentStatus)) {
      try {
        const paymentsResponse = await fetchRazorpayOrderPayments(order.paymentOrderId);
        const payments = paymentsResponse?.items || [];

        const captured =
          payments.find((p) => p.status === "captured") ||
          payments.find((p) => p.status === "authorized");

        if (captured) {
          const expectedPaise = Math.round(order.totalAmount * 100);

          let activePayment = captured;
          if (activePayment.status === "authorized") {
            activePayment = await captureRazorpayPayment(
              activePayment.id,
              expectedPaise,
              "INR",
            );
          }

          if (activePayment.status === "captured" && activePayment.amount === expectedPaise) {
            const completedOrder = await completeRazorpayPayment({
              razorpayOrderId: order.paymentOrderId,
              razorpayPaymentId: activePayment.id,
              paymentAmount: activePayment.amount,
              orderId: order._id,
            });

            return res.status(200).json({
              success: true,
              data: { order: toOrderResponse(completedOrder || order) },
            });
          }
        }
      } catch (rzpErr) {
        console.warn(
          `[Razorpay] Reconcile query warning for order ${order.orderNumber}:`,
          rzpErr.message,
        );
      }
    }

    const latestOrder = await GarbaOrder.findById(orderId);

    return res.status(200).json({
      success: true,
      data: {
        order: toOrderResponse(latestOrder || order),
      },
    });
  } catch (error) {
    console.error("Reconcile payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to check payment status. Please try again.",
    });
  }
};

export default {
  createPaymentOrder,
  verifyPayment,
  reconcilePayment,
};
