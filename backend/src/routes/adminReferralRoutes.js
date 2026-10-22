import express from "express";
import { getAdminReferrals } from "../controllers/adminReferralController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

router.use(requireAdmin);

router.get("/", getAdminReferrals);

export default router;
