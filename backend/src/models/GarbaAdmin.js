import mongoose from "mongoose";

const garbaAdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN"],
      default: "ADMIN",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    resetPasswordTokenHash: {
      type: String,
      default: null,
      select: false,
    },

    resetPasswordExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "garbapass_admins",
  },
);

const GarbaAdmin = mongoose.model("GarbaAdmin", garbaAdminSchema);

export default GarbaAdmin;
