import Razorpay from "razorpay";
import crypto from "node:crypto";

export const getRazorpayKeyId = () =>
  process.env.RAZORPAY_KEY_ID || process.env.PAYMENT_KEY_ID || "";

export const getRazorpayKeySecret = () =>
  process.env.RAZORPAY_KEY_SECRET || process.env.PAYMENT_KEY_SECRET || "";

export const getRazorpayWebhookSecret = () =>
  process.env.RAZORPAY_WEBHOOK_SECRET || "";

let currentKeyId = null;
let currentKeySecret = null;
let razorpayClientInstance = null;

export const getRazorpayClient = () => {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials are missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env.",
    );
  }

  if (
    !razorpayClientInstance ||
    currentKeyId !== keyId ||
    currentKeySecret !== keySecret
  ) {
    currentKeyId = keyId;
    currentKeySecret = keySecret;
    razorpayClientInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpayClientInstance;
};

// Export proxy for backwards compatibility with direct razorpay.* calls
export const razorpay = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getRazorpayClient();
      const value = client[prop];
      if (typeof value === "function") {
        return value.bind(client);
      }
      return value;
    },
  },
);

export const razorpayKeyId = getRazorpayKeyId();

/**
 * Verifies Razorpay Standard Checkout HMAC-SHA256 signature.
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 */
export const verifyRazorpayCheckoutSignature = ({
  orderId,
  paymentId,
  signature,
}) => {
  const keySecret = getRazorpayKeySecret();

  if (!orderId || !paymentId || !signature || !keySecret) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const actualBuffer = Buffer.from(String(signature).trim(), "utf8");

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch (error) {
    console.error("Razorpay signature verification error:", error);
    return false;
  }
};

/**
 * Creates an order in Razorpay.
 * Amount must be in paise (minimum 100 paise = ₹1).
 */
export const createRazorpayOrder = async ({
  amount,
  currency = "INR",
  receipt,
  notes = {},
}) => {
  const client = getRazorpayClient();

  return client.orders.create({
    amount: Math.round(amount),
    currency,
    receipt: receipt ? String(receipt).slice(0, 40) : undefined,
    notes,
  });
};

/**
 * Fetches payment details from Razorpay by Payment ID.
 */
export const fetchRazorpayPayment = async (paymentId) => {
  const client = getRazorpayClient();
  return client.payments.fetch(paymentId);
};

/**
 * Captures an authorized Razorpay payment.
 */
export const captureRazorpayPayment = async (paymentId, amount, currency = "INR") => {
  const client = getRazorpayClient();
  return client.payments.capture(paymentId, Math.round(amount), currency);
};

/**
 * Fetches payments belonging to a Razorpay Order ID.
 */
export const fetchRazorpayOrderPayments = async (orderId) => {
  const client = getRazorpayClient();
  return client.orders.fetchPayments(orderId);
};

export default razorpay;
