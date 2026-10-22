import express from "express";

import {
  createPass,
  getPasses,
  updatePass,
  deletePass,
} from "../controllers/adminPassController.js";

import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

router.use(requireAdmin);

router.post("/", createPass);

router.get("/", getPasses);

router.patch("/:id", updatePass);

router.delete("/:id", deletePass);

export default router;
