import mongoose from "mongoose";

import GarbaOrder from "../models/GarbaOrder.js";
import {
  createRazorpayOrder,
  razorpayKeyId,
  razorpay,
  verifyRazorpayCheckoutSignature,
} from "../services/razorpayService.js";
import { completeRazorpayPayment } from "../services/paymentCompletionService.js";

const completeCapturedPayment = async (order, payment) => {
  const expectedAmount = Math.round(order.totalAmount * 100);

  if (
    payment.order_id !== order.paymentOrderId ||
    payment.amount !== expectedAmount ||
    payment.currency !== "INR"
  ) {
    throw new Error("Razorpay payment details do not match this order");
  }

  let capturedPayment = payment;

  if (capturedPayment.status === "authorized") {
    capturedPayment = await razorpay.payments.capture(
      capturedPayment.id,
      expectedAmount,
      "INR",
    );
  }

  if (capturedPayment.status !== "captured") {
    return null;
  }

  return completeRazorpayPayment({
    razorpayOrderId: order.paymentOrderId,
    razorpayPaymentId: capturedPayment.id,
    paymentAmount: capturedPayment.amount,
  });
};

const toOrderResponse = (order) => ({
  _id: order._id,
  orderNumber: order.orderNumber,
  paymentStatus: order.paymentStatus,
  totalAmount: order.totalAmount,
  paymentId: order.paymentId,
});

export const createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid orderId",
      });
    }

    const order = await GarbaOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.expiresAt && new Date() >= order.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "Order has expired",
      });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(400).json({
        success: false,
        message: "Order has already been paid",
      });
    }

    if (
      order.paymentOrderId &&
      ["PENDING", "PROCESSING"].includes(order.paymentStatus)
    ) {
      return res.status(200).json({
        success: true,
        data: {
          razorpayOrderId: order.paymentOrderId,

          amount: Math.round(order.totalAmount * 100),

          currency: "INR",

          keyId: razorpayKeyId,

          orderId: order._id,
        },
      });
    }

    if (order.paymentStatus !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Payment cannot be created for this order",
      });
    }

    const razorpayOrder = await createRazorpayOrder({
      amount: Math.round(order.totalAmount * 100),

      currency: "INR",

      receipt: order.orderNumber,
    });

    order.paymentGateway = "RAZORPAY";

    order.paymentOrderId = razorpayOrder.id;

    order.paymentStatus = "PROCESSING";

    await order.save();

    return res.status(201).json({
      success: true,
      message: "Razorpay order created",

      data: {
        razorpayOrderId: razorpayOrder.id,

        amount: razorpayOrder.amount,

        currency: razorpayOrder.currency,

        keyId: razorpayKeyId,

        orderId: order._id,

        orderNumber: order.orderNumber,
      },
    });
  } catch (error) {
    console.error("Create payment order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create payment order",
    });
  }
};

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

    if (order.paymentStatus === "PAID") {
      return res.status(200).json({
        success: true,
        data: { order: toOrderResponse(order) },
      });
    }

    if (order.paymentStatus !== "PROCESSING" || !order.paymentOrderId) {
      return res.status(200).json({
        success: true,
        data: { order: toOrderResponse(order) },
      });
    }

    const { items: payments } = await razorpay.orders.fetchPayments(
      order.paymentOrderId,
    );
    const payment =
      payments.find((item) => item.status === "captured") ||
      payments.find((item) => item.status === "authorized");

    const completedOrder = payment
      ? await completeCapturedPayment(order, payment)
      : null;

    return res.status(200).json({
      success: true,
      data: {
        order: toOrderResponse(completedOrder || order),
      },
    });
  } catch (error) {
    console.error("Reconcile Razorpay payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to check payment status. Please try again.",
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body;

    if (
      !orderId ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return res.status(400).json({
        success: false,
        message: "Order ID and Razorpay payment verification fields are required",
      });
    }

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid orderId",
      });
    }

    if (
      !verifyRazorpayCheckoutSignature({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      })
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay payment signature",
      });
    }

    const order = await GarbaOrder.findById(orderId);

    if (!order || order.paymentOrderId !== razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: "Razorpay payment does not match this order",
      });
    }

    if (!["PROCESSING", "PAID"].includes(order.paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Order is not eligible for payment verification",
      });
    }

    const payment = await razorpay.payments.fetch(razorpayPaymentId);
    const completedOrder = await completeCapturedPayment(order, payment);

    if (!completedOrder) {
      return res.status(400).json({
        success: false,
        message: "Razorpay has not captured this payment",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        order: toOrderResponse(completedOrder),
      },
    });
  } catch (error) {
    console.error("Verify Razorpay payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment. Please try again.",
    });
  }
};
