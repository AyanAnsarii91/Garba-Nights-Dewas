import express from "express";
import cors from "cors";
import helmet from "helmet";

import eventRoutes from "./routes/eventRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import adminPassRoutes from "./routes/adminPassRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import razorpayWebhookRoutes from "./routes/razorpayWebhookRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

import adminOrderRoutes from "./routes/adminOrderRoutes.js";

import adminCheckinRoutes from "./routes/adminCheckinRoutes.js";

import adminScannerRoutes from "./routes/adminScannerRoutes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",

    credentials: true,
  }),
);

/*
 * Razorpay webhook MUST receive
 * the raw request body.
 *
 * Keep this BEFORE express.json().
 */
app.use("/api/payments/razorpay/webhook", razorpayWebhookRoutes);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "GarbaPass API is running 🚀",
  });
});

app.use("/api/events", eventRoutes);

app.use("/api/admin/auth", adminAuthRoutes);

app.use("/api/admin/passes", adminPassRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/tickets", ticketRoutes);

app.use("/api/payments", paymentRoutes);

app.use("/api/admin/dashboard", dashboardRoutes);

app.use("/api/admin/orders", adminOrderRoutes);

app.use("/api/admin/checkins", adminCheckinRoutes);

app.use("/api/admin/scanner", adminScannerRoutes);

export default app;
