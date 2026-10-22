import express from "express";

import { handlePhonePeWebhook } from "../controllers/phonepeWebhookController.js";

const router = express.Router();

// PhonePe S2S Webhook / Callback endpoint
router.post("/", express.json(), handlePhonePeWebhook);
router.post("/webhook", express.json(), handlePhonePeWebhook);
router.post("/callback", express.json(), handlePhonePeWebhook);

export default router;
