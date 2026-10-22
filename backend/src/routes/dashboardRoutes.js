import express from "express";

import { getDashboardStats } from "../controllers/dashboardController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/", requireAdmin, getDashboardStats);

export default router;
