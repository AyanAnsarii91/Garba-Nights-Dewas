import "dotenv/config";

import app from "./app.js";
import connectDatabase from "./config/database.js";

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 GarbaPass API running on port ${PORT}`);
      console.log("❤️  API health check: /api/health");

      // Periodically release expired unpaid reservations (runs every 60 seconds)
      import("./services/paymentCompletionService.js")
        .then(({ releaseExpiredReservations }) => {
          releaseExpiredReservations().catch(() => {});
          setInterval(() => {
            releaseExpiredReservations().catch(() => {});
          }, 60_000);
        })
        .catch((err) =>
          console.warn("Could not initialize reservation cleaner:", err.message),
        );
    });
  } catch (error) {
    console.error("❌ Failed to start GarbaPass API:", error.message);

    process.exit(1);
  }
};

startServer();
