import express from "express";

import { handleRazorpayWebhook } from "../controllers/razorpayWebhookController.js";

const router = express.Router();

router.post(
  "/",
  express.raw({
    type: "application/json",
  }),
  handleRazorpayWebhook,
);

export default router;
