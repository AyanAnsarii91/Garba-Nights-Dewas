import express from "express";

import {
  getAdminOrders,
  getAdminOrderById,
} from "../controllers/adminOrderController.js";

import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

router.use(requireAdmin);

router.get("/", getAdminOrders);

router.get("/:id", getAdminOrderById);

export default router;
