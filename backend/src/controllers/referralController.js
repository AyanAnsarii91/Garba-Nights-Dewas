import crypto from "node:crypto";
import GarbaReferral from "../models/GarbaReferral.js";

const PRODUCTION_FRONTEND_DOMAIN = "https://dholkinights.netlify.app";

const sanitizeCode = (raw) => {
  if (!raw) return "";
  return String(raw)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 20);
};

const createRandomSuffix = (length = 4) => {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .toUpperCase()
    .slice(0, length);
};

export const generateReferralCode = async (req, res) => {
  try {
    const { customerName = "", customerPhone = "", customerEmail = "", preferredCode = "" } = req.body;

    const trimmedPhone = customerPhone.trim();
    const trimmedName = customerName.trim();
    const trimmedEmail = customerEmail.trim().toLowerCase();

    // 1. If an active referral exists for this phone number, return it
    if (trimmedPhone) {
      const existing = await GarbaReferral.findOne({
        customerPhone: trimmedPhone,
        isActive: true,
      });

      if (existing) {
        return res.status(200).json({
          success: true,
          message: "Existing squad invite code retrieved",
          data: {
            referral: {
              code: existing.code,
              shareLink: `${PRODUCTION_FRONTEND_DOMAIN}/?ref=${existing.code}`,
              customerName: existing.customerName,
              totalVisits: existing.totalVisits,
              successfulOrders: existing.successfulOrders,
            },
          },
        });
      }
    }

    // 2. Generate a unique code
    let candidateCode = "";
    let isUnique = false;
    let attempts = 0;

    const customBase = sanitizeCode(preferredCode);

    if (customBase && customBase.length >= 4 && customBase.length <= 16) {
      const existingCustom = await GarbaReferral.findOne({ code: customBase });
      if (!existingCustom) {
        candidateCode = customBase;
        isUnique = true;
      }
    }

    while (!isUnique && attempts < 15) {
      attempts += 1;

      let prefix = "SQUAD";
      if (trimmedName) {
        const cleanedName = trimmedName.replace(/[^a-zA-Z]/g, "").toUpperCase();
        if (cleanedName.length >= 3) {
          prefix = cleanedName.slice(0, 5);
        }
      }

      candidateCode = `${prefix}${createRandomSuffix(4)}`;

      const exists = await GarbaReferral.findOne({ code: candidateCode });
      if (!exists) {
        isUnique = true;
      }
    }

    if (!isUnique) {
      candidateCode = `DK${Date.now().toString(36).toUpperCase()}`;
    }

    const referral = await GarbaReferral.create({
      code: candidateCode,
      customerName: trimmedName,
      customerPhone: trimmedPhone,
      customerEmail: trimmedEmail,
      totalVisits: 0,
      totalOrders: 0,
      successfulOrders: 0,
      totalTicketsSold: 0,
      totalRevenue: 0,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Unique squad referral code generated successfully",
      data: {
        referral: {
          code: referral.code,
          shareLink: `${PRODUCTION_FRONTEND_DOMAIN}/?ref=${referral.code}`,
          customerName: referral.customerName,
          totalVisits: referral.totalVisits,
          successfulOrders: referral.successfulOrders,
        },
      },
    });
  } catch (error) {
    console.error("Generate referral code error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate referral code",
    });
  }
};

export const trackReferralVisit = async (req, res) => {
  try {
    const rawCode = req.body?.code || req.query?.code;
    const cleanCode = sanitizeCode(rawCode);

    if (!cleanCode) {
      return res.status(400).json({
        success: false,
        message: "Referral code is required",
      });
    }

    const referral = await GarbaReferral.findOneAndUpdate(
      { code: cleanCode, isActive: true },
      {
        $inc: { totalVisits: 1 },
        $set: { lastUsedAt: new Date() },
      },
      { returnDocument: "after" },
    );

    if (!referral) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: "Referral code not found or inactive",
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      data: {
        code: referral.code,
        customerName: referral.customerName,
        totalVisits: referral.totalVisits,
      },
    });
  } catch (error) {
    console.error("Track referral visit error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to record referral visit",
    });
  }
};

export const validateReferralCode = async (req, res) => {
  try {
    const cleanCode = sanitizeCode(req.params.code);

    if (!cleanCode) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: "Referral code is required",
      });
    }

    const referral = await GarbaReferral.findOne({
      code: cleanCode,
      isActive: true,
    }).lean();

    if (!referral) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: "Referral code is invalid or inactive",
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      data: {
        code: referral.code,
        customerName: referral.customerName,
        shareLink: `${PRODUCTION_FRONTEND_DOMAIN}/?ref=${referral.code}`,
      },
    });
  } catch (error) {
    console.error("Validate referral code error:", error);

    return res.status(500).json({
      success: false,
      valid: false,
      message: "Failed to validate referral code",
    });
  }
};

export const getReferralStats = async (req, res) => {
  try {
    const rawCode = req.params?.code || req.query?.code;
    const cleanCode = sanitizeCode(rawCode);

    if (!cleanCode) {
      return res.status(400).json({
        success: false,
        message: "Referral code is required",
      });
    }

    const referral = await GarbaReferral.findOne({ code: cleanCode }).lean();

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Referral code not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        code: referral.code,
        customerName: referral.customerName,
        totalVisits: referral.totalVisits,
        totalOrders: referral.totalOrders,
        successfulOrders: referral.successfulOrders,
        shareLink: `${PRODUCTION_FRONTEND_DOMAIN}/?ref=${referral.code}`,
      },
    });
  } catch (error) {
    console.error("Get referral stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch referral stats",
    });
  }
};
