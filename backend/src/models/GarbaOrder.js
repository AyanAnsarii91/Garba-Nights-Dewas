import mongoose from "mongoose";

const garbaOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GarbaEvent",
      required: true,
      index: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    customerPhone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    customerEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    membersCount: {
      type: Number,
      required: true,
      min: 1,
    },

    items: [
      {
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

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        price: {
          type: Number,
          required: true,
          min: 0,
        },

        subtotal: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    convenienceFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: [
        "PENDING",
        "PROCESSING",
        "PAID",
        "FAILED",
        "CANCELLED",
        "REFUNDED",
      ],
      default: "PENDING",
      index: true,
    },

    paymentGateway: {
      type: String,
      default: "",
    },

    paymentOrderId: {
      type: String,
      default: "",
      index: true,
    },

    paymentId: {
      type: String,
      default: "",
      index: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "garbapass_orders",
  },
);

const GarbaOrder = mongoose.model("GarbaOrder", garbaOrderSchema);

export default GarbaOrder;
