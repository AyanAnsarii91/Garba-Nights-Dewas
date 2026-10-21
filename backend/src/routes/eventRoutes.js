import express from "express";
import { getEventBySlug } from "../controllers/eventController.js";

const router = express.Router();

router.get("/:slug", getEventBySlug);

export default router;