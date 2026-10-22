import crypto from "node:crypto";

/**
 * PhonePe Payment Gateway Service
 *
 * Supports PhonePe Standard Hosted Checkout (Pay Page) integration
 * using the official endpoints and SHA-256 X-VERIFY checksum validation.
 *
 * Environment variables:
 * - PHONEPE_MERCHANT_ID: Merchant ID provided by PhonePe (e.g. PGTESTPAYUAT86)
 * - PHONEPE_SALT_KEY: Secret salt key provided by PhonePe
 * - PHONEPE_SALT_INDEX: Salt index (default: "1")
 * - PHONEPE_ENV: "SANDBOX" or "PRODUCTION" (default: "SANDBOX")
 * - PHONEPE_HOST_URL: Optional custom override for PhonePe host URL
 * - BACKEND_URL: Base URL of backend (for callbackUrl)
 * - FRONTEND_URL: Base URL of frontend (for redirectUrl)
 * - PHONEPE_CALLBACK_URL: Explicit override for S2S webhook callback
 */

const getPhonePeConfig = () => {
  const env = (process.env.PHONEPE_ENV || "SANDBOX").toUpperCase();

  const isProduction = env === "PRODUCTION";

  // In production, credentials MUST come from environment variables.
  // In development/sandbox, fallback to standard PhonePe test credentials if not configured.
  const merchantId =
    process.env.PHONEPE_MERCHANT_ID || (isProduction ? "" : "PGTESTPAYUAT86");

  const saltKey =
    process.env.PHONEPE_SALT_KEY ||
    (isProduction ? "" : "96434309-7796-489d-8924-ab56988a6076");

  const saltIndex = String(process.env.PHONEPE_SALT_INDEX || "1").trim();

  const hostUrl =
    process.env.PHONEPE_HOST_URL ||
    (isProduction
      ? "https://api.phonepe.com/apis/hermes"
      : "https://api-preprod.phonepe.com/apis/pg-sandbox");

  const backendUrl = (
    process.env.BACKEND_URL ||
    (isProduction
      ? "https://garba-nights-dewas.onrender.com"
      : "http://localhost:5001")
  ).replace(/\/+$/, "");

  const frontendUrl = (
    process.env.FRONTEND_URL ||
    (isProduction
      ? "https://dholkinights.netlify.app"
      : "http://localhost:5173")
  ).replace(/\/+$/, "");

  const callbackUrl =
    process.env.PHONEPE_CALLBACK_URL ||
    `${backendUrl}/api/payments/phonepe/webhook`;

  return {
    merchantId,
    saltKey,
    saltIndex,
    hostUrl,
    backendUrl,
    frontendUrl,
    callbackUrl,
    isProduction,
  };
};

/**
 * Generates the SHA-256 checksum for PhonePe API calls:
 * SHA256(stringToHash) + "###" + saltIndex
 */
export const generateChecksum = (stringToHash, saltKey, saltIndex) => {
  const hash = crypto
    .createHash("sha256")
    .update(stringToHash)
    .digest("hex");

  return `${hash}###${saltIndex}`;
};

/**
 * Initiates a PhonePe Standard Checkout payment request (/pg/v1/pay)
 */
export const initiatePhonePePayment = async ({
  orderId,
  orderNumber,
  amount,
  customerPhone,
  customerEmail,
  customerName,
  redirectUrl,
  callbackUrl,
}) => {
  const config = getPhonePeConfig();

  if (!config.merchantId || !config.saltKey) {
    throw new Error(
      "PhonePe credentials are missing. Set PHONEPE_MERCHANT_ID and PHONEPE_SALT_KEY.",
    );
  }

  // Amount in paise (integer)
  const amountInPaise = Math.round(Number(amount) * 100);

  if (!amountInPaise || amountInPaise <= 0) {
    throw new Error("Invalid payment amount");
  }

  // PhonePe merchantTransactionId must be unique per payment attempt (max 35 chars, alphanumeric)
  const cleanOrderNumber = String(orderNumber || orderId)
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(-18);
  const merchantTransactionId = `GP_${cleanOrderNumber}_${Date.now().toString().slice(-8)}`;

  // Clean customer phone (10 digits)
  const cleanPhone = String(customerPhone || "")
    .replace(/[^0-9]/g, "")
    .slice(-10);

  // User ID representation for PhonePe
  const merchantUserId = `MUID_${cleanPhone || cleanOrderNumber}`.slice(0, 36);

  const effectiveRedirectUrl =
    redirectUrl || `${config.frontendUrl}/payment?orderId=${orderId}`;

  const effectiveCallbackUrl = callbackUrl || config.callbackUrl;

  const payload = {
    merchantId: config.merchantId,
    merchantTransactionId,
    merchantUserId,
    amount: amountInPaise,
    redirectUrl: effectiveRedirectUrl,
    redirectMode: "REDIRECT",
    callbackUrl: effectiveCallbackUrl,
    mobileNumber: cleanPhone || undefined,
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };

  const jsonString = JSON.stringify(payload);
  const base64Payload = Buffer.from(jsonString, "utf8").toString("base64");

  // Checksum formula for /pg/v1/pay:
  // SHA256(base64Payload + "/pg/v1/pay" + saltKey) + "###" + saltIndex
  const xVerify = generateChecksum(
    base64Payload + "/pg/v1/pay" + config.saltKey,
    "",
    config.saltIndex,
  );

  console.log(
    `[PhonePe] Initiating payment for order ${orderNumber}: ${merchantTransactionId} (₹${amount})`,
  );

  const response = await fetch(`${config.hostUrl}/pg/v1/pay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-VERIFY": xVerify,
    },
    body: JSON.stringify({
      request: base64Payload,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.success) {
    console.error("[PhonePe] Payment initiate error response:", data);
    const errorMsg =
      data?.message ||
      data?.code ||
      `PhonePe request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  const redirectInfo = data?.data?.instrumentResponse?.redirectInfo;
  const checkoutUrl = redirectInfo?.url;

  if (!checkoutUrl) {
    throw new Error("PhonePe did not return a valid checkout redirect URL");
  }

  return {
    merchantTransactionId,
    checkoutUrl,
    amount: amountInPaise,
    currency: "INR",
    gateway: "PHONEPE",
  };
};

/**
 * Checks payment status from PhonePe using the Check Status API
 * GET /pg/v1/status/{merchantId}/{merchantTransactionId}
 */
export const checkPhonePeStatus = async (merchantTransactionId) => {
  const config = getPhonePeConfig();

  if (!merchantTransactionId) {
    throw new Error("merchantTransactionId is required to check PhonePe status");
  }

  const statusEndpoint = `/pg/v1/status/${config.merchantId}/${merchantTransactionId}`;

  // Checksum formula for status check:
  // SHA256(statusEndpoint + saltKey) + "###" + saltIndex
  const xVerify = generateChecksum(
    statusEndpoint + config.saltKey,
    "",
    config.saltIndex,
  );

  const response = await fetch(`${config.hostUrl}${statusEndpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-VERIFY": xVerify,
      "X-MERCHANT-ID": config.merchantId,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok && !data) {
    throw new Error(`PhonePe status check HTTP ${response.status}`);
  }

  return {
    success: Boolean(data?.success),
    code: data?.code || "UNKNOWN",
    message: data?.message || "",
    state: data?.data?.state || (data?.code === "PAYMENT_SUCCESS" ? "COMPLETED" : "UNKNOWN"),
    transactionId: data?.data?.transactionId || "",
    amount: data?.data?.amount,
    paymentInstrument: data?.data?.paymentInstrument || null,
    raw: data,
  };
};

/**
 * Securely verifies the Server-to-Server (S2S) callback X-VERIFY signature.
 *
 * PhonePe S2S Callback Checksum Formula:
 * SHA256(responsePayload + saltKey) + "###" + saltIndex
 * where responsePayload is the base64 encoded string from req.body.response.
 */
export const verifyPhonePeWebhookSignature = ({
  responsePayload,
  xVerifyHeader,
}) => {
  if (
    !responsePayload ||
    !xVerifyHeader ||
    typeof responsePayload !== "string" ||
    typeof xVerifyHeader !== "string"
  ) {
    return false;
  }

  const config = getPhonePeConfig();

  if (!config.saltKey) {
    return false;
  }

  const expectedChecksum = generateChecksum(
    responsePayload + config.saltKey,
    "",
    config.saltIndex,
  );

  const [expectedHash, expectedIndex] = expectedChecksum.split("###");
  const [receivedHash, receivedIndex] = xVerifyHeader.split("###");

  if (!receivedHash || !receivedIndex || receivedIndex !== expectedIndex) {
    return false;
  }

  const bufReceived = Buffer.from(receivedHash);
  const bufExpected = Buffer.from(expectedHash);

  if (bufReceived.length !== bufExpected.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufReceived, bufExpected);
};

export default {
  initiatePhonePePayment,
  checkPhonePeStatus,
  verifyPhonePeWebhookSignature,
  getPhonePeConfig,
};
