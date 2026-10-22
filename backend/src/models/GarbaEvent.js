import mongoose from "mongoose";

const garbaEventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    venue: {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      address: {
        type: String,
        default: "",
      },

      coordinates: {
        latitude: {
          type: Number,
          default: null,
        },

        longitude: {
          type: Number,
          default: null,
        },
      },
    },

    eventDate: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      default: "",
    },

    endTime: {
      type: String,
      default: "",
    },

    bannerImage: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    bookingOpen: {
      type: Boolean,
      default: true,
    },

    bookingCloseAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "garbapass_events",
  }
);

const GarbaEvent = mongoose.model(
  "GarbaEvent",
  garbaEventSchema
);

export default GarbaEvent;