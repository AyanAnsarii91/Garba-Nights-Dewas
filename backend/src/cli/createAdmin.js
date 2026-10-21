import "dotenv/config";
import readline from "readline";

import connectDatabase from "../../src/config/database.js";
import GarbaAdmin from "../../src/models/GarbaAdmin.js";
import { hashPassword } from "../../src/services/passwordService.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question) =>
  new Promise((resolve) => {
    rl.question(question, resolve);
  });

const createAdmin = async () => {
  try {
    await connectDatabase();

    console.log("\n🔐 GarbaPass Admin Creation\n");

    const name = (await ask("Admin name: ")).trim();

    const email = (await ask("Admin email: ")).trim().toLowerCase();

    const password = await ask("Admin password: ");

    if (!name || !email || !password) {
      throw new Error("Name, email and password are required.");
    }

    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }

    const existingAdmin = await GarbaAdmin.findOne({
      email,
    });

    if (existingAdmin) {
      throw new Error("An admin with this email already exists.");
    }

    const passwordHash = await hashPassword(password);

    const admin = await GarbaAdmin.create({
      name,
      email,
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    });

    console.log("\n✅ Admin created successfully!");

    console.log({
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Admin creation failed:", error.message);

    process.exit(1);
  } finally {
    rl.close();
  }
};

createAdmin();
