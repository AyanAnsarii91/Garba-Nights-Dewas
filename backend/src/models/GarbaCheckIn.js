import mongoose from "mongoose";

const garbaCheckInSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GarbaTicket",
      required: true,
      index: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GarbaEvent",
      required: true,
      index: true,
    },

    ticketNumber: {
      type: String,
      required: true,
      index: true,
    },

    result: {
      type: String,
      enum: ["SUCCESS", "ALREADY_USED", "INVALID", "CANCELLED", "REFUNDED"],
      required: true,
    },

    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GarbaAdmin",
      default: null,
    },

    scannerName: {
      type: String,
      default: "",
    },

    scannedAt: {
      type: Date,
      default: Date.now,
    },

    note: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "garbapass_checkins",
  },
);

const GarbaCheckIn = mongoose.model("GarbaCheckIn", garbaCheckInSchema);

export default GarbaCheckIn;
