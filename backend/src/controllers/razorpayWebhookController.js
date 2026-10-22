import crypto from "crypto";

import { completeRazorpayPayment } from "../services/paymentCompletionService.js";

const verifyWebhookSignature = (rawBody, signature) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret || !signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest();
  const actualSignature = Buffer.from(signature, "hex");

  return (
    actualSignature.length === expectedSignature.length &&
    crypto.timingSafeEqual(actualSignature, expectedSignature)
  );
};

export const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay signature",
      });
    }

    const isValid = verifyWebhookSignature(req.body, signature);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const payload = JSON.parse(req.body.toString());

    const event = payload.event;

    console.log(`📩 Razorpay webhook: ${event}`);

    if (event === "order.paid") {
      const paymentEntity = payload.payload.payment.entity;

      await completeRazorpayPayment({
        razorpayOrderId: paymentEntity.order_id,
        razorpayPaymentId: paymentEntity.id,
        paymentAmount: paymentEntity.amount,
      });
    }

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("Razorpay webhook error:", error);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};
