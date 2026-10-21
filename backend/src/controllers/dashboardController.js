import mongoose from "mongoose";

import GarbaEvent from "../models/GarbaEvent.js";
import GarbaPass from "../models/GarbaPass.js";
import GarbaOrder from "../models/GarbaOrder.js";
import GarbaTicket from "../models/GarbaTicket.js";
import GarbaCheckIn from "../models/GarbaCheckIn.js";

export const getDashboardStats = async (req, res) => {
  try {
    /*
     * ---------------------------------------------------------
     * 1. FIND ACTIVE EVENT
     * ---------------------------------------------------------
     */

    const event = await GarbaEvent.findOne({
      slug: "garba-night-2026",
      isActive: true,
    }).lean();

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Active Garba event not found",
      });
    }

    const eventId = event._id;

    /*
     * ---------------------------------------------------------
     * 2. GET PASS INVENTORY
     * ---------------------------------------------------------
     */

    const passes = await GarbaPass.find({
      event: eventId,
    })
      .sort({ sortOrder: 1 })
      .lean();

    const inventory = passes.map((pass) => ({
      id: pass._id,
      passType: pass.passType,
      name: pass.name,
      price: pass.price,
      membersCount: pass.membersCount,
      totalQuantity: pass.totalQuantity,
      soldQuantity: pass.soldQuantity,
      reservedQuantity: pass.reservedQuantity,
      availableQuantity: Math.max(
        0,
        pass.totalQuantity -
          pass.soldQuantity -
          pass.reservedQuantity
      ),
      maxPerOrder: pass.maxPerOrder,
      isActive: pass.isActive,
    }));

    /*
     * ---------------------------------------------------------
     * 3. BASIC INVENTORY TOTALS
     * ---------------------------------------------------------
     */

    const totalInventory = inventory.reduce(
      (sum, pass) => sum + pass.totalQuantity,
      0
    );

    const passesSold = inventory.reduce(
      (sum, pass) => sum + pass.soldQuantity,
      0
    );

    const reservedInventory = inventory.reduce(
      (sum, pass) => sum + pass.reservedQuantity,
      0
    );

    const availableInventory = inventory.reduce(
      (sum, pass) => sum + pass.availableQuantity,
      0
    );

    /*
     * ---------------------------------------------------------
     * 4. TOTAL REVENUE
     *
     * IMPORTANT:
     * Only PAID orders are counted.
     *
     * CANCELLED / FAILED / PENDING / PROCESSING
     * are NOT revenue.
     * ---------------------------------------------------------
     */

    const revenueResult = await GarbaOrder.aggregate([
      {
        $match: {
          event: new mongoose.Types.ObjectId(eventId),
          paymentStatus: "PAID",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$totalAmount",
          },
          paidOrders: {
            $sum: 1,
          },
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0
        ? revenueResult[0].totalRevenue
        : 0;

    const paidOrders =
      revenueResult.length > 0
        ? revenueResult[0].paidOrders
        : 0;

    /*
     * ---------------------------------------------------------
     * 5. REVENUE BY PASS TYPE
     *
     * Uses PAID orders only.
     * ---------------------------------------------------------
     */

    const revenueByPassType = await GarbaOrder.aggregate([
      {
        $match: {
          event: new mongoose.Types.ObjectId(eventId),
          paymentStatus: "PAID",
        },
      },
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items.passType",
          revenue: {
            $sum: "$items.subtotal",
          },
          quantity: {
            $sum: "$items.quantity",
          },
        },
      },
      {
        $sort: {
          revenue: -1,
        },
      },
    ]);

    const revenueBreakdown = ["SINGLE", "COUPLE", "GROUP"].map(
      (passType) => {
        const found = revenueByPassType.find(
          (item) => item._id === passType
        );

        return {
          passType,
          revenue: found?.revenue || 0,
          quantity: found?.quantity || 0,
        };
      }
    );

    /*
     * ---------------------------------------------------------
     * 6. TICKETS ISSUED
     *
     * Tickets belonging to paid orders.
     * ---------------------------------------------------------
     */

    const ticketsIssued = await GarbaTicket.countDocuments({
      event: eventId,
      status: {
        $nin: ["CANCELLED", "REFUNDED"],
      },
    });

    /*
     * ---------------------------------------------------------
     * 7. SUCCESSFUL CHECK-INS
     * ---------------------------------------------------------
     */

    const checkIns = await GarbaCheckIn.countDocuments({
      event: eventId,
      result: "SUCCESS",
    });

    /*
     * ---------------------------------------------------------
     * 8. RECENT ORDERS
     *
     * Latest 10 orders.
     * ---------------------------------------------------------
     */

    const recentOrders = await GarbaOrder.find({
      event: eventId,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        "orderNumber customerName customerPhone customerEmail items subtotal convenienceFee totalAmount paymentStatus paidAt createdAt"
      )
      .lean();

    /*
     * ---------------------------------------------------------
     * 9. ORDER STATUS COUNTS
     * ---------------------------------------------------------
     */

    const orderStatusResult = await GarbaOrder.aggregate([
      {
        $match: {
          event: new mongoose.Types.ObjectId(eventId),
        },
      },
      {
        $group: {
          _id: "$paymentStatus",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    const orderStatuses = {
      PENDING: 0,
      PROCESSING: 0,
      PAID: 0,
      FAILED: 0,
      CANCELLED: 0,
      REFUNDED: 0,
    };

    orderStatusResult.forEach((item) => {
      if (Object.prototype.hasOwnProperty.call(orderStatuses, item._id)) {
        orderStatuses[item._id] = item.count;
      }
    });

    /*
     * ---------------------------------------------------------
     * 10. FINAL RESPONSE
     * ---------------------------------------------------------
     */

    return res.status(200).json({
      success: true,

      data: {
        event: {
          id: event._id,
          name: event.name,
          slug: event.slug,
          venue: event.venue,
          eventDate: event.eventDate,
          startTime: event.startTime,
          endTime: event.endTime,
          bookingOpen: event.bookingOpen,
          bookingCloseAt: event.bookingCloseAt,
        },

        stats: {
          totalRevenue,
          paidOrders,
          passesSold,
          ticketsIssued,
          checkIns,

          totalInventory,
          reservedInventory,
          availableInventory,
        },

        revenueBreakdown,

        inventory,

        orderStatuses,

        recentOrders,
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard statistics",
    });
  }
};