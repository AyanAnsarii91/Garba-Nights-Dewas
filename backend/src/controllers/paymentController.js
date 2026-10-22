import mongoose from "mongoose";

import GarbaOrder from "../models/GarbaOrder.js";
import {
  initiatePhonePePayment,
  checkPhonePeStatus,
} from "../services/phonepeService.js";
import {
  completePhonePePayment,
  failPhonePePayment,
} from "../services/paymentCompletionService.js";

const toOrderResponse = (order) => ({
  _id: order._id,
  orderNumber: order.orderNumber,
  paymentStatus: order.paymentStatus,
  totalAmount: order.totalAmount,
  paymentOrderId: order.paymentOrderId,
  paymentId: order.paymentId,
  paymentGateway: order.paymentGateway,
});

/**
 * Creates/initiates a PhonePe payment session for a GarbaPass order.
 */
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
        message: "Order has expired. Please select your pass again.",
      });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(400).json({
        success: false,
        message: "Order has already been paid",
      });
    }

    // If already processing and has an active transaction ID, verify if still valid
    // Or generate a fresh PhonePe session
    const paymentInitiation = await initiatePhonePePayment({
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: order.totalAmount,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
    });

    order.paymentGateway = "PHONEPE";
    order.paymentOrderId = paymentInitiation.merchantTransactionId;
    order.paymentStatus = "PROCESSING";

    await order.save();

    return res.status(201).json({
      success: true,
      message: "PhonePe payment initiated",
      data: {
        checkoutUrl: paymentInitiation.checkoutUrl,
        merchantTransactionId: paymentInitiation.merchantTransactionId,
        amount: paymentInitiation.amount,
        currency: "INR",
        orderId: order._id,
        orderNumber: order.orderNumber,
        gateway: "PHONEPE",
      },
    });
  } catch (error) {
    console.error("Create payment order error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to initiate payment",
    });
  }
};

/**
 * Reconciles the order payment status against PhonePe.
 * Never trusts frontend assertions alone.
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

    // If order is processing and has a payment transaction ID, query PhonePe Status API
    if (order.paymentStatus === "PROCESSING" && order.paymentOrderId) {
      try {
        const phonePeStatus = await checkPhonePeStatus(order.paymentOrderId);

        if (
          phonePeStatus.state === "COMPLETED" ||
          phonePeStatus.code === "PAYMENT_SUCCESS"
        ) {
          const completedOrder = await completePhonePePayment({
            merchantTransactionId: order.paymentOrderId,
            transactionId: phonePeStatus.transactionId,
            paymentAmount: phonePeStatus.amount,
          });

          return res.status(200).json({
            success: true,
            data: { order: toOrderResponse(completedOrder || order) },
          });
        }

        if (
          phonePeStatus.state === "FAILED" ||
          ["PAYMENT_ERROR", "PAYMENT_DECLINED", "TIMED_OUT"].includes(
            phonePeStatus.code,
          )
        ) {
          const failedOrder = await failPhonePePayment({
            merchantTransactionId: order.paymentOrderId,
            transactionId: phonePeStatus.transactionId,
            reason: phonePeStatus.code,
          });

          return res.status(200).json({
            success: true,
            data: { order: toOrderResponse(failedOrder || order) },
          });
        }
      } catch (phonePeError) {
        console.warn(
          `[PhonePe] Reconcile status check warning for order ${order.orderNumber}:`,
          phonePeError.message,
        );
      }
    }

    // Refresh and return latest order state
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

/**
 * Verifies payment for an order by querying PhonePe backend directly.
 * Does not trust any client-supplied signature or success payload.
 */
export const verifyPayment = async (req, res) => {
  return reconcilePayment(req, res);
};

export default {
  createPaymentOrder,
  reconcilePayment,
  verifyPayment,
};
