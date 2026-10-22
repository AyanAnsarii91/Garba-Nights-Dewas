import mongoose from "mongoose";

import GarbaOrder from "../models/GarbaOrder.js";

const allowedPaymentStatuses = [
  "PENDING",
  "PROCESSING",
  "PAID",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
];

export const getAdminOrders = async (req, res) => {
  try {
    const { status, search = "", page = 1, limit = 20 } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);

    const pageLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    const filter = {};

    if (status && allowedPaymentStatuses.includes(status)) {
      filter.paymentStatus = status;
    }

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");

      filter.$or = [
        { orderNumber: searchRegex },
        { customerName: searchRegex },
        { customerPhone: searchRegex },
        { customerEmail: searchRegex },
        { referralCode: searchRegex },
        {
          "items.passName": searchRegex,
        },
      ];
    }

    const skip = (currentPage - 1) * pageLimit;

    const [orders, totalOrders] = await Promise.all([
      GarbaOrder.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),

      GarbaOrder.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,

      data: {
        orders,

        pagination: {
          page: currentPage,
          limit: pageLimit,
          total: totalOrders,
          totalPages: Math.ceil(totalOrders / pageLimit),
        },
      },
    });
  } catch (error) {
    console.error("Get admin orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load orders",
    });
  }
};

export const getAdminOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await GarbaOrder.findById(id)
      .populate("event", "name slug venue eventDate startTime endTime")
      .populate("items.pass", "name passType price membersCount")
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        order,
      },
    });
  } catch (error) {
    console.error("Get admin order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load order",
    });
  }
};
