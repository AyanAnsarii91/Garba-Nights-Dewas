import mongoose from "mongoose";

const garbaReferralSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    customerName: {
      type: String,
      default: "",
      trim: true,
    },

    customerPhone: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    customerEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    totalVisits: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },

    successfulOrders: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalTicketsSold: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastUsedAt: {
      type: Date,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: "garbapass_referrals",
  },
);

const GarbaReferral = mongoose.model("GarbaReferral", garbaReferralSchema);

export default GarbaReferral;
