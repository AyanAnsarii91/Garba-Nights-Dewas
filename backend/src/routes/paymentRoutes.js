import express from "express";

import {
  createPaymentOrder,
  reconcilePayment,
  verifyPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-order", createPaymentOrder);
router.post("/reconcile", reconcilePayment);
router.post("/verify", verifyPayment);
router.post("/verify-payment", verifyPayment);

export default router;
