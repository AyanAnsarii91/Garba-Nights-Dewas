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
    });
  } catch (error) {
    console.error("❌ Failed to start GarbaPass API:", error.message);

    process.exit(1);
  }
};

startServer();
