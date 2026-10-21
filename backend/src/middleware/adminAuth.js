import jwt from "jsonwebtoken";
import GarbaAdmin from "../models/GarbaAdmin.js";

export const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await GarbaAdmin.findById(decoded.adminId);

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Admin account is inactive or invalid",
      });
    }

    req.admin = admin;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};
