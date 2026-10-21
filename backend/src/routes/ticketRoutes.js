import express from "express";

import {
  getTicketByNumber,
  getTicketsByOrder,
} from "../controllers/ticketController.js";

const router = express.Router();

router.get("/order/:orderId", getTicketsByOrder);
router.get("/:ticketNumber", getTicketByNumber);

export default router;
