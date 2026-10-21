import mongoose from "mongoose";

import GarbaTicket from "../models/GarbaTicket.js";
import GarbaCheckIn from "../models/GarbaCheckIn.js";
import GarbaOrder from "../models/GarbaOrder.js";

export const scanTicket = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { qrToken } = req.body;

    if (!qrToken || typeof qrToken !== "string") {
      return res.status(400).json({
        success: false,
        message: "QR token is required",
      });
    }

    const cleanToken = qrToken.trim();

    if (!cleanToken) {
      return res.status(400).json({
        success: false,
        message: "Invalid QR token",
      });
    }

    session.startTransaction();

    /*
     * First find the ticket including qrToken.
     */

    const ticket = await GarbaTicket.findOne({
      qrToken: cleanToken,
    })
      .select(
        "+qrToken ticketNumber event order passType passName membersCount holderName holderPhone holderEmail status issuedAt checkedInAt",
      )
      .populate("event", "name slug venue eventDate startTime endTime")
      .session(session);

    /*
     * -------------------------------------------------------
     * INVALID QR
     * -------------------------------------------------------
     */

    if (!ticket) {
      await GarbaCheckIn.create(
        [
          {
            ticket: undefined,
            event: undefined,
            ticketNumber: "UNKNOWN",
            result: "INVALID",
            scannedBy: req.admin?._id || null,
            scannerName: req.admin?.name || "Admin",
            note: "Ticket not found",
          },
        ],
        { session },
      );

      await session.commitTransaction();

      return res.status(404).json({
        success: false,
        result: "INVALID",
        message: "Invalid QR code",
      });
    }

    /*
     * -------------------------------------------------------
     * CHECK PAYMENT
     * -------------------------------------------------------
     */

    const order = await GarbaOrder.findById(ticket.order)
      .select("orderNumber paymentStatus totalAmount paidAt")
      .session(session)
      .lean();

    if (!order || order.paymentStatus !== "PAID") {
      await GarbaCheckIn.create(
        [
          {
            ticket: ticket._id,
            event: ticket.event?._id,
            ticketNumber: ticket.ticketNumber,
            result: "INVALID",
            scannedBy: req.admin?._id || null,
            scannerName: req.admin?.name || "Admin",
            note: "Order payment is not confirmed",
          },
        ],
        { session },
      );

      await session.commitTransaction();

      return res.status(409).json({
        success: false,
        result: "INVALID",
        message: "Payment for this ticket is not confirmed",
      });
    }

    /*
     * -------------------------------------------------------
     * ALREADY USED
     * -------------------------------------------------------
     */

    if (ticket.status === "USED") {
      await GarbaCheckIn.create(
        [
          {
            ticket: ticket._id,
            event: ticket.event?._id,
            ticketNumber: ticket.ticketNumber,
            result: "ALREADY_USED",
            scannedBy: req.admin?._id || null,
            scannerName: req.admin?.name || "Admin",
            note: "Ticket was already checked in",
          },
        ],
        { session },
      );

      await session.commitTransaction();

      return res.status(409).json({
        success: false,
        result: "ALREADY_USED",
        message: "This ticket has already been used",
        data: {
          ticket: {
            ticketNumber: ticket.ticketNumber,
            passName: ticket.passName,
            passType: ticket.passType,
            membersCount: ticket.membersCount,
            holderName: ticket.holderName,
            checkedInAt: ticket.checkedInAt,
          },
        },
      });
    }

    /*
     * -------------------------------------------------------
     * CANCELLED / REFUNDED
     * -------------------------------------------------------
     */

    if (ticket.status === "CANCELLED" || ticket.status === "REFUNDED") {
      const result = ticket.status === "CANCELLED" ? "CANCELLED" : "REFUNDED";

      await GarbaCheckIn.create(
        [
          {
            ticket: ticket._id,
            event: ticket.event?._id,
            ticketNumber: ticket.ticketNumber,
            result,
            scannedBy: req.admin?._id || null,
            scannerName: req.admin?.name || "Admin",
            note: `Ticket is ${ticket.status.toLowerCase()}`,
          },
        ],
        { session },
      );

      await session.commitTransaction();

      return res.status(409).json({
        success: false,
        result,
        message: `This ticket is ${ticket.status.toLowerCase()}`,
      });
    }

    /*
     * -------------------------------------------------------
     * ATOMIC ACTIVE -> USED
     *
     * This is the important race-condition protection.
     * -------------------------------------------------------
     */

    const checkedInAt = new Date();

    const updatedTicket = await GarbaTicket.findOneAndUpdate(
      {
        _id: ticket._id,
        status: "ACTIVE",
      },
      {
        $set: {
          status: "USED",
          checkedInAt,
        },
      },
      {
        new: true,
        session,
      },
    );

    /*
     * Another scanner could have used it between
     * our read and update.
     */

    if (!updatedTicket) {
      await GarbaCheckIn.create(
        [
          {
            ticket: ticket._id,
            event: ticket.event?._id,
            ticketNumber: ticket.ticketNumber,
            result: "ALREADY_USED",
            scannedBy: req.admin?._id || null,
            scannerName: req.admin?.name || "Admin",
            note: "Ticket was used by another scan",
          },
        ],
        { session },
      );

      await session.commitTransaction();

      return res.status(409).json({
        success: false,
        result: "ALREADY_USED",
        message: "This ticket has already been used",
      });
    }

    /*
     * -------------------------------------------------------
     * SUCCESS CHECK-IN RECORD
     * -------------------------------------------------------
     */

    await GarbaCheckIn.create(
      [
        {
          ticket: updatedTicket._id,
          event: ticket.event?._id,
          ticketNumber: updatedTicket.ticketNumber,
          result: "SUCCESS",
          scannedBy: req.admin?._id || null,
          scannerName: req.admin?.name || "Admin",
          scannedAt: checkedInAt,
          note: "Entry approved",
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      result: "SUCCESS",
      message: "Entry approved",
      data: {
        ticket: {
          ticketNumber: updatedTicket.ticketNumber,
          passName: updatedTicket.passName,
          passType: updatedTicket.passType,
          membersCount: updatedTicket.membersCount,
          holderName: updatedTicket.holderName,
          holderPhone: updatedTicket.holderPhone,
          checkedInAt,
        },

        order: {
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
        },

        event: ticket.event,
      },
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Scan ticket error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process ticket scan",
    });
  } finally {
    await session.endSession();
  }
};
