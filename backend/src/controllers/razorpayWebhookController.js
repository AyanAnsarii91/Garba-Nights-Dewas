import crypto from "crypto";

import {
  completeRazorpayPayment,
  failRazorpayPayment,
} from "../services/paymentCompletionService.js";
import { getRazorpayWebhookSecret } from "../services/razorpayService.js";

/**
 * Verifies Razorpay Webhook signature using HMAC-SHA256 and the raw request body.
 */
export const verifyWebhookSignature = (rawBody, signature) => {
  const webhookSecret = getRazorpayWebhookSecret();

  if (!webhookSecret || !signature || !rawBody) {
    return false;
  }

  try {
    const bodyBuffer = Buffer.isBuffer(rawBody)
      ? rawBody
      : Buffer.from(typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody), "utf8");

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(bodyBuffer)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const actualBuffer = Buffer.from(String(signature).trim(), "utf8");

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch (error) {
    console.error("Webhook signature verification error:", error);
    return false;
  }
};

/**
 * Handles incoming Razorpay webhook events idempotently.
 */
export const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature =
      req.headers["x-razorpay-signature"] || req.headers["X-Razorpay-Signature"];

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay webhook signature header",
      });
    }

    const isValid = verifyWebhookSignature(req.body, signature);

    if (!isValid) {
      console.warn("⚠️ Received Razorpay webhook with invalid signature");
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const rawString = Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : typeof req.body === "string"
        ? req.body
        : JSON.stringify(req.body);

    const payload = JSON.parse(rawString);
    const event = payload?.event;

    console.log(`📩 Razorpay webhook received: ${event} (ID: ${payload?.payload?.payment?.entity?.id || "N/A"})`);

    if (event === "order.paid" || event === "payment.captured") {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderEntity = payload.payload?.order?.entity;

      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const razorpayPaymentId = paymentEntity?.id;
      const paymentAmount = paymentEntity?.amount ?? orderEntity?.amount_paid;

      if (!razorpayOrderId) {
        console.warn("Webhook event missing razorpayOrderId, skipping");
        return res.status(200).json({ success: true, message: "No order ID found" });
      }

      await completeRazorpayPayment({
        razorpayOrderId,
        razorpayPaymentId,
        paymentAmount,
      });
    } else if (event === "payment.failed") {
      const paymentEntity = payload.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;
      const reason = paymentEntity?.error_description || "Payment failed";

      if (razorpayOrderId) {
        await failRazorpayPayment({
          razorpayOrderId,
          razorpayPaymentId,
          reason,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("Razorpay webhook error:", error);

    // Return 500 so Razorpay can retry if server temporary issue, or 200 if business validation
    return res.status(500).json({
      success: false,
      message: error.message || "Webhook processing failed",
    });
  }
};

export default {
  handleRazorpayWebhook,
  verifyWebhookSignature,
};
