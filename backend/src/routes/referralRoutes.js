import express from "express";
import {
  generateReferralCode,
  trackReferralVisit,
  validateReferralCode,
  getReferralStats,
} from "../controllers/referralController.js";

const router = express.Router();

router.post("/generate", generateReferralCode);
router.post("/track-visit", trackReferralVisit);
router.get("/validate/:code", validateReferralCode);
router.get("/stats/:code", getReferralStats);

export default router;
