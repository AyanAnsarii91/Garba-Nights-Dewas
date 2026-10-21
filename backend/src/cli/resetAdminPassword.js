import "dotenv/config";
import readline from "readline";

import connectDatabase from "../config/database.js";
import GarbaAdmin from "../models/GarbaAdmin.js";

import { hashPassword } from "../services/passwordService.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question) =>
  new Promise((resolve) => {
    rl.question(question, resolve);
  });

const resetAdminPassword = async () => {
  try {
    await connectDatabase();

    console.log("\n🔐 GarbaPass Admin Password Reset\n");

    const email = (await ask("Admin email: ")).trim().toLowerCase();

    const newPassword = await ask("New password: ");

    if (!email || !newPassword) {
      throw new Error("Email and password are required.");
    }

    if (newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }

    const admin = await GarbaAdmin.findOne({
      email,
    });

    if (!admin) {
      throw new Error("Admin account not found.");
    }

    admin.passwordHash = await hashPassword(newPassword);

    admin.resetPasswordTokenHash = null;

    admin.resetPasswordExpiresAt = null;

    await admin.save();

    console.log("\n✅ Password reset successfully.");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Password reset failed:", error.message);

    process.exit(1);
  } finally {
    rl.close();
  }
};

resetAdminPassword();
