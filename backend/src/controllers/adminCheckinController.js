import mongoose from "mongoose";

import GarbaTicket from "../models/GarbaTicket.js";
import GarbaCheckIn from "../models/GarbaCheckIn.js";

const allowedResults = [
  "SUCCESS",
  "ALREADY_USED",
  "INVALID",
  "CANCELLED",
  "REFUNDED",
];

export const getAdminCheckins = async (req, res) => {
  try {
    const { result, search = "", page = 1, limit = 30 } = req.query;
    const currentPage = Math.max(1, Number(page) || 1);
    const pageLimit = Math.min(100, Math.max(1, Number(limit) || 30));
    const filter = {};

    if (typeof result === "string" && allowedResults.includes(result)) {
      filter.result = result;
    }

    const normalizedSearch =
      typeof search === "string" ? search.trim() : "";

    if (normalizedSearch) {
      const escapedSearch = normalizedSearch.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );
      const searchRegex = new RegExp(escapedSearch, "i");

      filter.$or = [
        { ticketNumber: searchRegex },
        { scannerName: searchRegex },
      ];
    }

    const skip = (currentPage - 1) * pageLimit;
    const [checkins, totalCheckins] = await Promise.all([
      GarbaCheckIn.find(filter)
        .populate(
          "ticket",
          "ticketNumber passName passType membersCount holderName holderPhone",
        )
        .sort({ scannedAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),
      GarbaCheckIn.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        checkins,
        pagination: {
          page: currentPage,
          limit: pageLimit,
          total: totalCheckins,
          totalPages: Math.ceil(totalCheckins / pageLimit),
        },
      },
    });
  } catch (error) {
    console.error("Get admin check-ins error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load check-ins",
    });
  }
};

const getResultMessage = (result) => {
  switch (result) {
    case "SUCCESS":
      return "Entry allowed";

    case "ALREADY_USED":
      return "This ticket has already been used";

    case "CANCELLED":
      return "This ticket has been cancelled";

    case "REFUNDED":
      return "This ticket has been refunded";

    default:
      return "Invalid ticket";
  }
};

export const scanTicket = async (req, res) => {
  try {
    const { qrToken } = req.body;

    if (!qrToken || typeof qrToken !== "string") {
      return res.status(400).json({
        success: false,
        result: "INVALID",
        message: "QR token is required",
      });
    }

    const token = qrToken.trim();

    if (!token) {
      return res.status(400).json({
        success: false,
        result: "INVALID",
        message: "QR token is empty",
      });
    }

    /*
     * IMPORTANT:
     *
     * We atomically change ACTIVE -> USED.
     *
     * This means if two scanners try to scan the
     * same ticket at almost exactly the same time,
     * only one request can successfully claim it.
     */

    const now = new Date();

    const ticket = await GarbaTicket.findOneAndUpdate(
      {
        qrToken: token,
        status: "ACTIVE",
      },
      {
        $set: {
          status: "USED",
          checkedInAt: now,
        },
      },
      {
        new: true,
      },
    )
      .select("+qrToken")
      .populate("event", "name slug venue eventDate startTime endTime")
      .populate("order", "orderNumber paymentStatus totalAmount paidAt")
      .lean();

    /*
     * SUCCESS
     */
    if (ticket) {
      /*
       * Payment must still be PAID.
       *
       * Normally this will already be guaranteed because
       * tickets are created only after payment confirmation.
       * We keep the check here as another safety layer.
       */

      if (ticket.order?.paymentStatus !== "PAID") {
        /*
         * Roll back the ticket because it should not have
         * been accepted.
         */
        await GarbaTicket.updateOne(
          {
            _id: ticket._id,
            status: "USED",
          },
          {
            $set: {
              status: "ACTIVE",
              checkedInAt: null,
            },
          },
        );

        return res.status(409).json({
          success: false,
          result: "INVALID",
          message: "Ticket payment is not confirmed",
        });
      }

      await GarbaCheckIn.create({
        ticket: ticket._id,
        event: ticket.event._id,
        ticketNumber: ticket.ticketNumber,
        result: "SUCCESS",
        scannedBy: req.admin?.id || null,
        scannerName: req.admin?.name || "",
        scannedAt: now,
        note: "Ticket successfully checked in",
      });

      return res.status(200).json({
        success: true,
        result: "SUCCESS",
        message: "Entry allowed",
        data: {
          ticket: {
            ticketNumber: ticket.ticketNumber,
            passName: ticket.passName,
            passType: ticket.passType,
            membersCount: ticket.membersCount,
            holderName: ticket.holderName,
            holderPhone: ticket.holderPhone,
            status: ticket.status,
            checkedInAt: ticket.checkedInAt,
          },
          event: ticket.event,
          order: ticket.order,
        },
      });
    }

    /*
     * If ACTIVE ticket wasn't found, find the ticket again
     * so we can tell the scanner WHY it failed.
     */

    const existingTicket = await GarbaTicket.findOne({
      qrToken: token,
    })
      .select(
        "ticketNumber passName passType membersCount holderName holderPhone status checkedInAt event order",
      )
      .populate("event", "name slug venue eventDate startTime endTime")
      .populate("order", "orderNumber paymentStatus totalAmount paidAt")
      .lean();

    /*
     * Completely unknown QR.
     */
    if (!existingTicket) {
      return res.status(404).json({
        success: false,
        result: "INVALID",
        message: "Invalid QR ticket",
      });
    }

    /*
     * Already scanned.
     */
    if (existingTicket.status === "USED") {
      await GarbaCheckIn.create({
        ticket: existingTicket._id,
        event: existingTicket.event._id,
        ticketNumber: existingTicket.ticketNumber,
        result: "ALREADY_USED",
        scannedBy: req.admin?.id || null,
        scannerName: req.admin?.name || "",
        scannedAt: now,
        note: "Ticket was scanned again after successful check-in",
      });

      return res.status(409).json({
        success: false,
        result: "ALREADY_USED",
        message: getResultMessage("ALREADY_USED"),
        data: {
          ticket: {
            ticketNumber: existingTicket.ticketNumber,
            passName: existingTicket.passName,
            passType: existingTicket.passType,
            membersCount: existingTicket.membersCount,
            holderName: existingTicket.holderName,
            status: existingTicket.status,
            checkedInAt: existingTicket.checkedInAt,
          },
        },
      });
    }

    /*
     * Cancelled ticket.
     */
    if (existingTicket.status === "CANCELLED") {
      await GarbaCheckIn.create({
        ticket: existingTicket._id,
        event: existingTicket.event._id,
        ticketNumber: existingTicket.ticketNumber,
        result: "CANCELLED",
        scannedBy: req.admin?.id || null,
        scannerName: req.admin?.name || "",
        scannedAt: now,
        note: "Cancelled ticket attempted at entry",
      });

      return res.status(409).json({
        success: false,
        result: "CANCELLED",
        message: getResultMessage("CANCELLED"),
        data: {
          ticket: {
            ticketNumber: existingTicket.ticketNumber,
            passName: existingTicket.passName,
            holderName: existingTicket.holderName,
            status: existingTicket.status,
          },
        },
      });
    }

    /*
     * Refunded ticket.
     */
    if (existingTicket.status === "REFUNDED") {
      await GarbaCheckIn.create({
        ticket: existingTicket._id,
        event: existingTicket.event._id,
        ticketNumber: existingTicket.ticketNumber,
        result: "REFUNDED",
        scannedBy: req.admin?.id || null,
        scannerName: req.admin?.name || "",
        scannedAt: now,
        note: "Refunded ticket attempted at entry",
      });

      return res.status(409).json({
        success: false,
        result: "REFUNDED",
        message: getResultMessage("REFUNDED"),
        data: {
          ticket: {
            ticketNumber: existingTicket.ticketNumber,
            passName: existingTicket.passName,
            holderName: existingTicket.holderName,
            status: existingTicket.status,
          },
        },
      });
    }

    /*
     * Anything else, such as PENDING.
     */
    return res.status(409).json({
      success: false,
      result: "INVALID",
      message: "Ticket is not valid for entry",
      data: {
        ticket: {
          ticketNumber: existingTicket.ticketNumber,
          passName: existingTicket.passName,
          holderName: existingTicket.holderName,
          status: existingTicket.status,
        },
      },
    });
  } catch (error) {
    console.error("Scan ticket error:", error);

    return res.status(500).json({
      success: false,
      result: "INVALID",
      message: "Unable to process ticket scan",
    });
  }
};
