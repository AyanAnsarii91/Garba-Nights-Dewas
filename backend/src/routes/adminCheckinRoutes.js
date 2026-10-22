import express from "express";

import { requireAdmin } from "../middleware/adminAuth.js";
import {
  getAdminCheckins,
  scanTicket,
} from "../controllers/adminCheckinController.js";

const router = express.Router();

router.use(requireAdmin);

router.get("/", getAdminCheckins);
router.post("/scan", scanTicket);

export default router;