import { trackReferralVisit } from "../services/api.js";

const REFERRAL_STORAGE_KEY = "dholki_referral_code";
const MY_REFERRAL_KEY = "dholki_my_referral";
const PRODUCTION_DOMAIN = "https://dholkinights.netlify.app";

/**
 * Clean and uppercase an incoming referral code
 */
export const sanitizeReferralCode = (raw) => {
  if (!raw) return "";
  return String(raw)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 20);
};

/**
 * Capture ?ref= from the current window URL, store it and optionally notify backend
 */
export const captureReferralFromUrl = () => {
  try {
    if (typeof window === "undefined") return "";

    const urlParams = new URLSearchParams(window.location.search);
    let refParam = urlParams.get("ref");

    // Also check hash in case of hash router or anchor tags
    if (!refParam && window.location.hash.includes("ref=")) {
      const match = window.location.hash.match(/[?&]ref=([A-Za-z0-9_-]+)/);
      if (match) refParam = match[1];
    }

    const cleanCode = sanitizeReferralCode(refParam);

    if (cleanCode) {
      localStorage.setItem(REFERRAL_STORAGE_KEY, cleanCode);
      sessionStorage.setItem(REFERRAL_STORAGE_KEY, cleanCode);

      // Track visit once per session for this specific code
      const sessionTrackingKey = `dholki_tracked_visit_${cleanCode}`;
      if (!sessionStorage.getItem(sessionTrackingKey)) {
        sessionStorage.setItem(sessionTrackingKey, "1");
        trackReferralVisit(cleanCode).catch((err) => {
          console.debug("Silent referral visit track notice:", err?.message);
        });
      }

      return cleanCode;
    }
  } catch (error) {
    console.debug("Error capturing referral parameter:", error);
  }

  return getStoredReferralCode();
};

/**
 * Retrieve any active referral code stored in the browser session or local storage
 */
export const getStoredReferralCode = () => {
  try {
    if (typeof window === "undefined") return "";
    const sessionCode = sessionStorage.getItem(REFERRAL_STORAGE_KEY);
    if (sessionCode) return sanitizeReferralCode(sessionCode);

    const localCode = localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (localCode) return sanitizeReferralCode(localCode);
  } catch {
    return "";
  }
  return "";
};

/**
 * Build the canonical production shareable link for a given referral code
 */
export const buildReferralShareLink = (code) => {
  const cleanCode = sanitizeReferralCode(code);
  return `${PRODUCTION_DOMAIN}/?ref=${cleanCode}`;
};

/**
 * Store user's own generated squad referral info
 */
export const saveMyReferral = (referralData) => {
  try {
    if (typeof window !== "undefined" && referralData) {
      localStorage.setItem(MY_REFERRAL_KEY, JSON.stringify(referralData));
    }
  } catch (err) {
    console.debug("Failed to cache referral locally:", err);
  }
};

/**
 * Retrieve user's own generated squad referral info
 */
export const getMyReferral = () => {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(MY_REFERRAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
