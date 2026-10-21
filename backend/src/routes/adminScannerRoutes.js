import express from "express";

import {
  scanTicket,
} from "../controllers/adminScannerController.js";

import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

router.use(requireAdmin);

router.post("/scan", scanTicket);

export default router;