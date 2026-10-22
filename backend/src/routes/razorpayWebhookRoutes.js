import express from "express";

import { handleRazorpayWebhook } from "../controllers/razorpayWebhookController.js";

const router = express.Router();

router.post(
  "/",
  express.raw({
    type: "*/*",
  }),
  handleRazorpayWebhook,
);

export default router;
