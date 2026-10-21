import Razorpay from "razorpay";
import crypto from "node:crypto";

export const razorpayKeyId =
  process.env.RAZORPAY_KEY_ID || process.env.PAYMENT_KEY_ID;
const razorpayKeySecret =
  process.env.RAZORPAY_KEY_SECRET || process.env.PAYMENT_KEY_SECRET;

if (!razorpayKeyId || !razorpayKeySecret) {
  throw new Error(
    "Razorpay credentials are missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env.",
  );
}

export const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

export const verifyRazorpayCheckoutSignature = ({
  orderId,
  paymentId,
  signature,
}) => {
  const expectedSignature = crypto
    .createHmac("sha256", razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest();
  const actualSignature = Buffer.from(signature, "hex");

  return (
    actualSignature.length === expectedSignature.length &&
    crypto.timingSafeEqual(actualSignature, expectedSignature)
  );
};

export const createRazorpayOrder = async ({ amount, currency, receipt }) => {
  return razorpay.orders.create({
    amount,
    currency,
    receipt,
  });
};

export default razorpay;
