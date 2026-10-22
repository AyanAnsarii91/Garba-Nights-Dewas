import crypto from "crypto";

import GarbaAdmin from "../models/GarbaAdmin.js";

import { comparePassword, hashPassword } from "../services/passwordService.js";

import { createAdminToken } from "../services/adminTokenService.js";

import { sendPasswordResetEmail } from "../services/emailService.js";

const sanitizeAdmin = (admin) => ({
  id: admin._id,
  name: admin.name,
  email: admin.email,
  role: admin.role,
  isActive: admin.isActive,
  lastLoginAt: admin.lastLoginAt,
  createdAt: admin.createdAt,
});

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const admin = await GarbaAdmin.findOne({
      email: email.toLowerCase().trim(),
    }).select("+passwordHash");

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordValid = await comparePassword(password, admin.passwordHash);

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    admin.lastLoginAt = new Date();

    await admin.save();

    const token = createAdminToken(admin);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        admin: sanitizeAdmin(admin),
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

export const getCurrentAdmin = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      admin: sanitizeAdmin(req.admin),
    },
  });
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const admin = await GarbaAdmin.findOne({
      email: email.toLowerCase().trim(),
    }).select("+resetPasswordTokenHash +resetPasswordExpiresAt");

    /*
     * Always return the same public response,
     * whether the email exists or not.
     *
     * This prevents account enumeration.
     */
    if (!admin || !admin.isActive) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a reset link has been sent.",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    admin.resetPasswordTokenHash = tokenHash;

    admin.resetPasswordExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await admin.save();

    const frontendUrl = process.env.FRONTEND_URL?.replace(/\/+$/, "");

    if (!frontendUrl) {
      throw new Error("FRONTEND_URL must be configured to send reset links");
    }

    const resetUrl = `${frontendUrl}/admin/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail({
      email: admin.email,
      name: admin.name,
      resetUrl,
    });

    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process password reset",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const admin = await GarbaAdmin.findOne({
      resetPasswordTokenHash: tokenHash,

      resetPasswordExpiresAt: {
        $gt: new Date(),
      },
    }).select("+resetPasswordTokenHash +resetPasswordExpiresAt");

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    admin.passwordHash = await hashPassword(newPassword);

    admin.resetPasswordTokenHash = null;

    admin.resetPasswordExpiresAt = null;

    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password",
    });
  }
};
