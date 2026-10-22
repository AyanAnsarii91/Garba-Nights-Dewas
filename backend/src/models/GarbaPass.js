import mongoose from "mongoose";

const garbaPassSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GarbaEvent",
      required: true,
      index: true,
    },

    passType: {
      type: String,
      enum: ["SINGLE", "COUPLE", "GROUP"],
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },

    membersCount: {
      type: Number,
      required: true,
      min: 1,
    },

    totalQuantity: {
      type: Number,
      required: true,
      min: 1,
    },

    soldQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    reservedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxPerOrder: {
      type: Number,
      default: 5,
      min: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "garbapass_passes",
  },
);

garbaPassSchema.index({ event: 1, passType: 1 }, { unique: true });

const GarbaPass = mongoose.model("GarbaPass", garbaPassSchema);

export default GarbaPass;
