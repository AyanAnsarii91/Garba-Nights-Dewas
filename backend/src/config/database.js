import dns from "node:dns";
import mongoose from "mongoose";

const connectDatabase = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`🍃 MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    if (error.message.includes("querySrv") || error.message.includes("EBADRESP")) {
      try {
        console.warn("⚠️ DNS resolution issue detected, retrying with Google DNS...");
        dns.setServers(["8.8.8.8", "1.1.1.1"]);
        const connection = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`🍃 MongoDB connected via fallback DNS: ${connection.connection.host}`);
        return;
      } catch (retryError) {
        console.error("❌ MongoDB connection failed:", retryError.message);
        process.exit(1);
      }
    }
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDatabase;
