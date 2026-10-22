import mongoose from "mongoose";

const garbaTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    qrToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
      select: false,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GarbaEvent",
      required: true,
      index: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GarbaOrder",
      required: true,
      index: true,
    },

    pass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GarbaPass",
      required: true,
    },

    passType: {
      type: String,
      enum: ["SINGLE", "COUPLE", "GROUP"],
      required: true,
    },

    passName: {
      type: String,
      required: true,
    },

    membersCount: {
      type: Number,
      required: true,
      min: 1,
    },

    holderName: {
      type: String,
      required: true,
      trim: true,
    },

    holderPhone: {
      type: String,
      required: true,
      trim: true,
    },

    holderEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "USED", "CANCELLED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },

    issuedAt: {
      type: Date,
      default: null,
    },

    checkedInAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "garbapass_tickets",
  },
);

const GarbaTicket = mongoose.model("GarbaTicket", garbaTicketSchema);

export default GarbaTicket;
