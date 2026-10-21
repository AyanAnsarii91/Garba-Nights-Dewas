import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

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

/*
|--------------------------------------------------------------------------
| Paths
|--------------------------------------------------------------------------
*/

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicPath = path.join(__dirname, "../public");

/*
|--------------------------------------------------------------------------
| Basic Configuration
|--------------------------------------------------------------------------
*/

const allowedFrontendOrigins = new Set(
  (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean),
);

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedFrontendOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  }),
);

/*
|--------------------------------------------------------------------------
| Traffic Metrics
|--------------------------------------------------------------------------
|
| Lightweight in-memory metrics for the API status page.
|
| Note:
| These values reset whenever the server restarts.
|
*/

const traffic = {
  total: 0,
  successful: 0,
  errors: 0,
  requests: [],
  lastRequest: null,
};

app.use((req, res, next) => {
  traffic.total += 1;
  traffic.lastRequest = new Date();

  traffic.requests.push(Date.now());

  /*
   * Keep only requests from the last 60 seconds.
   */
  const cutoff = Date.now() - 60_000;

  traffic.requests = traffic.requests.filter((time) => time >= cutoff);

  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      traffic.successful += 1;
    } else if (res.statusCode >= 400) {
      traffic.errors += 1;
    }
  });

  next();
});

/*
|--------------------------------------------------------------------------
| Razorpay Webhook
|--------------------------------------------------------------------------
|
| IMPORTANT:
| This route must come BEFORE express.json().
| Razorpay signature verification requires the raw request body.
|
*/

app.use("/api/payments/razorpay/webhook", razorpayWebhookRoutes);

/*
|--------------------------------------------------------------------------
| JSON Body Parser
|--------------------------------------------------------------------------
*/

app.use(express.json());

/*
|--------------------------------------------------------------------------
| Static Public Files
|--------------------------------------------------------------------------
|
| Serves:
| backend/public/index.html
|
*/

app.use(express.static(publicPath));

/*
|--------------------------------------------------------------------------
| API Status Page
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "GarbaPass API is running 🚀",
  });
});

/*
|--------------------------------------------------------------------------
| Live API Status
|--------------------------------------------------------------------------
*/

app.get("/api/status", (req, res) => {
  const cutoff = Date.now() - 60_000;

  const recentRequests = traffic.requests.filter((time) => time >= cutoff);

  const databaseConnected = mongoose.connection.readyState === 1;

  res.json({
    success: true,

    status: databaseConnected ? "ok" : "degraded",

    service: "GarbaPass API",

    environment: process.env.NODE_ENV || "development",

    uptime: Math.floor(process.uptime()),

    requests: {
      total: traffic.total,
      successful: traffic.successful,
      errors: traffic.errors,
      perMinute: recentRequests.length,
      lastRequest: traffic.lastRequest,
    },

    database: {
      status: databaseConnected ? "connected" : "disconnected",
      name: mongoose.connection.name || "GarbaPass",
    },

    timestamp: new Date(),
  });
});

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

app.use("/api/events", eventRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/tickets", ticketRoutes);

app.use("/api/payments", paymentRoutes);

/*
|--------------------------------------------------------------------------
| Admin Authentication
|--------------------------------------------------------------------------
*/

app.use("/api/admin/auth", adminAuthRoutes);

/*
|--------------------------------------------------------------------------
| Admin Pass Management
|--------------------------------------------------------------------------
*/

app.use("/api/admin/passes", adminPassRoutes);

/*
|--------------------------------------------------------------------------
| Admin Dashboard
|--------------------------------------------------------------------------
*/

app.use("/api/admin/dashboard", dashboardRoutes);

/*
|--------------------------------------------------------------------------
| Admin Orders
|--------------------------------------------------------------------------
*/

app.use("/api/admin/orders", adminOrderRoutes);

/*
|--------------------------------------------------------------------------
| Admin Check-ins
|--------------------------------------------------------------------------
*/

app.use("/api/admin/checkins", adminCheckinRoutes);

/*
|--------------------------------------------------------------------------
| Admin Scanner
|--------------------------------------------------------------------------
*/

app.use("/api/admin/scanner", adminScannerRoutes);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use((error, req, res, next) => {
  console.error("❌ API Error:", error);

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal server error",
  });
});

export default app;
