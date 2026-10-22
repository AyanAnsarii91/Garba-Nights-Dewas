import mongoose from "mongoose";

import GarbaEvent from "../models/GarbaEvent.js";
import GarbaPass from "../models/GarbaPass.js";
import GarbaOrder from "../models/GarbaOrder.js";
import GarbaReferral from "../models/GarbaReferral.js";
import { releaseExpiredReservations } from "../services/paymentCompletionService.js";

const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);

  return `GP${timestamp}${random}`;
};

export const createOrder = async (req, res) => {
  // Free any expired reservations first so available inventory is up to date
  await releaseExpiredReservations().catch((err) =>
    console.warn("Expired reservation release non-blocking error:", err.message),
  );

  const session = await mongoose.startSession();

  try {
    const {
      eventId,
      customerName,
      customerPhone,
      customerEmail,
      items,
      referralCode,
    } = req.body;

    if (
      !eventId ||
      !customerName ||
      !customerPhone ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "eventId, customerName, customerPhone and items are required",
      });
    }

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid eventId",
      });
    }

    const event = await GarbaEvent.findOne({
      _id: eventId,
      isActive: true,
      bookingOpen: true,
    });

    if (!event) {
      return res.status(400).json({
        success: false,
        message: "Event is unavailable for booking",
      });
    }

    if (event.bookingCloseAt && new Date() >= event.bookingCloseAt) {
      return res.status(400).json({
        success: false,
        message: "Booking has closed",
      });
    }

    const orderItems = [];
    let subtotal = 0;
    let membersCount = 0;

    session.startTransaction();

    for (const item of items) {
      const { passId, quantity } = item;

      if (!mongoose.isValidObjectId(passId)) {
        throw new Error("Invalid passId");
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error("Quantity must be a positive integer");
      }

      // Check and atomically reserve inventory ensuring:
      // soldQuantity + reservedQuantity + requestedQuantity <= totalQuantity
      const pass = await GarbaPass.findOneAndUpdate(
        {
          _id: passId,
          event: eventId,
          isActive: true,

          maxPerOrder: {
            $gte: quantity,
          },

          $expr: {
            $lte: [
              {
                $add: [
                  { $ifNull: ["$soldQuantity", 0] },
                  { $ifNull: ["$reservedQuantity", 0] },
                  quantity,
                ],
              },
              "$totalQuantity",
            ],
          },
        },
        {
          $inc: {
            reservedQuantity: quantity,
          },
        },
        {
          returnDocument: "after",
          session,
        },
      );

      if (!pass) {
        throw new Error("Pass is unavailable or insufficient quantity");
      }

      if (quantity > pass.maxPerOrder) {
        throw new Error(
          `${pass.name}: maximum ${pass.maxPerOrder} allowed per order`,
        );
      }

      const itemSubtotal = pass.price * quantity;

      orderItems.push({
        pass: pass._id,
        passType: pass.passType,
        passName: pass.name,
        membersCount: pass.membersCount,
        quantity,
        price: pass.price,
        subtotal: itemSubtotal,
      });

      subtotal += itemSubtotal;
      membersCount += pass.membersCount * quantity;
    }

    const convenienceFee = 0;
    const totalAmount = subtotal + convenienceFee;

    let appliedReferral = null;
    let cleanRefCode = "";

    if (referralCode) {
      cleanRefCode = String(referralCode)
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, "");

      if (cleanRefCode) {
        appliedReferral = await GarbaReferral.findOne({
          code: cleanRefCode,
          isActive: true,
        }).session(session);

        if (appliedReferral) {
          await GarbaReferral.updateOne(
            { _id: appliedReferral._id },
            {
              $inc: { totalOrders: 1 },
              $set: { lastUsedAt: new Date() },
            },
            { session },
          );
        }
      }
    }

    const order = await GarbaOrder.create(
      [
        {
          orderNumber: generateOrderNumber(),

          event: eventId,

          customerName: customerName.trim(),

          customerPhone: customerPhone.trim(),

          customerEmail: customerEmail?.trim() || "",

          membersCount,

          items: orderItems,

          subtotal,

          convenienceFee,

          totalAmount,

          paymentStatus: "PENDING",

          referralCode: appliedReferral ? appliedReferral.code : cleanRefCode,

          referral: appliedReferral ? appliedReferral._id : null,

          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        order: order[0],
      },
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Create order error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create order",
    });
  } finally {
    session.endSession();
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await GarbaOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.json({
      success: true,
      data: {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
          totalAmount: order.totalAmount,
          paymentOrderId: order.paymentOrderId,
          paymentId: order.paymentId,
        },
      },
    });
  } catch (error) {
    console.error("Get order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch order.",
    });
  }
};
