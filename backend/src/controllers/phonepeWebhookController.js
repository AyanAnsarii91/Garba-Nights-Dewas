import {
  verifyPhonePeWebhookSignature,
} from "../services/phonepeService.js";
import {
  completePhonePePayment,
  failPhonePePayment,
} from "../services/paymentCompletionService.js";

/**
 * Handles PhonePe Server-to-Server (S2S) Webhook notifications.
 *
 * Requirements:
 * 1. Verify X-VERIFY header using SHA256(responsePayload + saltKey) + "###" + saltIndex.
 * 2. Decode Base64 response into JSON.
 * 3. Verify order reference and exact amount.
 * 4. Idempotently update order state.
 * 5. Issue tickets ONLY on confirmed payment.
 * 6. Always respond with HTTP 200 to acknowledge receipt.
 */
export const handlePhonePeWebhook = async (req, res) => {
  try {
    const xVerify =
      req.headers["x-verify"] ||
      req.headers["X-VERIFY"] ||
      req.headers["x-verify-checksum"];

    // In Express with express.json(), req.body has { response: "ey..." }
    // If raw body was passed, parse it.
    let responsePayload = null;

    if (req.body && typeof req.body === "object" && req.body.response) {
      responsePayload = req.body.response;
    } else if (typeof req.body === "string") {
      try {
        const parsed = JSON.parse(req.body);
        responsePayload = parsed.response;
      } catch {
        responsePayload = req.body;
      }
    } else if (req.body && Buffer.isBuffer(req.body)) {
      try {
        const parsed = JSON.parse(req.body.toString("utf8"));
        responsePayload = parsed.response;
      } catch {
        responsePayload = req.body.toString("utf8");
      }
    }

    if (!xVerify || !responsePayload) {
      console.warn("⚠️ PhonePe webhook: Missing X-VERIFY or response payload");
      return res.status(400).json({
        success: false,
        message: "Missing X-VERIFY header or response payload",
      });
    }

    // Step 1: Validate signature
    const isSignatureValid = verifyPhonePeWebhookSignature({
      responsePayload,
      xVerifyHeader: xVerify,
    });

    if (!isSignatureValid) {
      console.error("❌ PhonePe webhook: Invalid X-VERIFY signature mismatch!");
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    // Step 2: Decode Base64 payload
    let decodedString = "";
    try {
      decodedString = Buffer.from(responsePayload, "base64").toString("utf8");
    } catch (err) {
      console.error("❌ PhonePe webhook: Base64 decode failed:", err);
      return res.status(400).json({
        success: false,
        message: "Failed to decode base64 response",
      });
    }

    const payload = JSON.parse(decodedString);
    console.log(
      `📩 PhonePe S2S webhook received for txn ${payload?.data?.merchantTransactionId}: code=${payload.code}, state=${payload?.data?.state}`,
    );

    const transactionData = payload.data || {};
    const merchantTransactionId = transactionData.merchantTransactionId;
    const transactionId = transactionData.transactionId || "";
    const paymentAmount = transactionData.amount;
    const state = transactionData.state;
    const code = payload.code;

    if (!merchantTransactionId) {
      console.warn("⚠️ PhonePe webhook: Missing merchantTransactionId");
      return res.status(400).json({
        success: false,
        message: "Missing merchantTransactionId in webhook data",
      });
    }

    // Step 3: Handle terminal states
    if (state === "COMPLETED" || code === "PAYMENT_SUCCESS") {
      await completePhonePePayment({
        merchantTransactionId,
        transactionId,
        paymentAmount,
      });
    } else if (
      state === "FAILED" ||
      code === "PAYMENT_ERROR" ||
      code === "PAYMENT_DECLINED" ||
      code === "TIMED_OUT"
    ) {
      await failPhonePePayment({
        merchantTransactionId,
        transactionId,
        reason: code,
      });
    } else {
      console.log(
        `ℹ️ PhonePe webhook: non-terminal state "${state || code}" for txn ${merchantTransactionId}`,
      );
    }

    // PhonePe expects HTTP 200 OK
    return res.status(200).json({
      success: true,
      message: "PhonePe webhook processed successfully",
    });
  } catch (error) {
    console.error("❌ PhonePe webhook processing error:", error);

    // Return 500 so PhonePe retries if it was an internal database/network failure
    return res.status(500).json({
      success: false,
      message: error.message || "Webhook processing failed",
    });
  }
};

export default {
  handlePhonePeWebhook,
};
