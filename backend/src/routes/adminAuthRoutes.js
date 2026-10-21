import express from "express";

import {
  loginAdmin,
  getCurrentAdmin,
  forgotPassword,
  resetPassword,
} from "../controllers/adminAuthController.js";

import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

router.post("/login", loginAdmin);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

router.get("/me", requireAdmin, getCurrentAdmin);

export default router;
