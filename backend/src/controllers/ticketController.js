import mongoose from "mongoose";
import QRCode from "qrcode";

import GarbaOrder from "../models/GarbaOrder.js";
import GarbaTicket from "../models/GarbaTicket.js";

const excludedTicketStatuses = ["CANCELLED", "REFUNDED"];

const ticketFields =
  "ticketNumber passType passName membersCount holderName holderPhone holderEmail status issuedAt checkedInAt cancelledAt";

const orderFields = "orderNumber paymentStatus subtotal convenienceFee totalAmount paidAt";

const serializeTicket = async (ticket) => {
  const qrCode = await QRCode.toDataURL(ticket.qrToken, {
    errorCorrectionLevel: "H",
    margin: 4,
    width: 800,
  });

  return {
    ticketNumber: ticket.ticketNumber,
    passName: ticket.passName,
    passType: ticket.passType,
    membersCount: ticket.membersCount,
    holderName: ticket.holderName,
    holderPhone: ticket.holderPhone,
    holderEmail: ticket.holderEmail,
    status: ticket.status,
    issuedAt: ticket.issuedAt,
    checkedInAt: ticket.checkedInAt,
    cancelledAt: ticket.cancelledAt,
    event: ticket.event,
    order: ticket.order,
    qrCode,
  };
};

export const getTicketByNumber = async (req, res) => {
  try {
    const ticket = await GarbaTicket.findOne({
      ticketNumber: req.params.ticketNumber,
    })
      .select(`${ticketFields} +qrToken`)
      .populate("event", "name slug description venue eventDate startTime endTime")
      .populate("order", orderFields)
      .lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (excludedTicketStatuses.includes(ticket.status)) {
      return res.status(410).json({
        success: false,
        message: `This ticket is ${ticket.status.toLowerCase()} and is not valid for entry`,
      });
    }

    if (ticket.order?.paymentStatus !== "PAID") {
      return res.status(404).json({
        success: false,
        message: "Ticket is not available until its order is paid",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ticket: await serializeTicket(ticket),
      },
    });
  } catch (error) {
    console.error("Get ticket error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load ticket",
    });
  }
};

export const getTicketsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid orderId",
      });
    }

    const order = await GarbaOrder.findById(orderId)
      .select(orderFields)
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus !== "PAID") {
      return res.status(409).json({
        success: false,
        message: "Tickets are available after payment is confirmed",
      });
    }

    const tickets = await GarbaTicket.find({
      order: orderId,
      status: { $nin: excludedTicketStatuses },
    })
      .select(`${ticketFields} +qrToken`)
      .populate("event", "name slug description venue eventDate startTime endTime")
      .populate("order", orderFields)
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: tickets.length,
      data: {
        order: {
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
          subtotal: order.subtotal,
          convenienceFee: order.convenienceFee,
          totalAmount: order.totalAmount,
          paidAt: order.paidAt,
        },
        tickets: await Promise.all(tickets.map(serializeTicket)),
      },
    });
  } catch (error) {
    console.error("Get order tickets error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load order tickets",
    });
  }
};
