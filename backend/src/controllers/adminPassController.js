import GarbaPass from "../models/GarbaPass.js";
import GarbaEvent from "../models/GarbaEvent.js";

const allowedPassTypes = ["SINGLE", "COUPLE", "GROUP"];

export const createPass = async (req, res) => {
  try {
    const {
      eventId,
      passType,
      name,
      description,
      price,
      currency,
      membersCount,
      totalQuantity,
      maxPerOrder,
      sortOrder,
    } = req.body;

    if (!eventId || !passType || !name) {
      return res.status(400).json({
        success: false,
        message: "eventId, passType and name are required",
      });
    }

    if (!allowedPassTypes.includes(passType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pass type",
      });
    }

    const event = await GarbaEvent.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const existingPass = await GarbaPass.findOne({
      event: eventId,
      passType,
    });

    if (existingPass) {
      return res.status(409).json({
        success: false,
        message: `${passType} pass already exists for this event`,
      });
    }

    const pass = await GarbaPass.create({
      event: eventId,
      passType,
      name,
      description: description || "",
      price,
      currency: currency || "INR",
      membersCount,
      totalQuantity,
      maxPerOrder: maxPerOrder || 5,
      sortOrder: sortOrder || 0,
    });

    return res.status(201).json({
      success: true,
      message: "Pass created successfully",
      data: pass,
    });
  } catch (error) {
    console.error("Create pass error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create pass",
    });
  }
};

export const getPasses = async (req, res) => {
  try {
    const filter = {};

    if (req.query.eventId) {
      filter.event = req.query.eventId;
    }

    const passes = await GarbaPass.find(filter)
      .populate("event", "name slug eventDate")
      .sort({
        event: 1,
        sortOrder: 1,
      });

    return res.status(200).json({
      success: true,
      count: passes.length,
      data: passes,
    });
  } catch (error) {
    console.error("Get passes error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch passes",
    });
  }
};

export const updatePass = async (req, res) => {
  try {
    const { id } = req.params;

    const allowedFields = [
      "name",
      "description",
      "price",
      "currency",
      "membersCount",
      "totalQuantity",
      "maxPerOrder",
      "isActive",
      "sortOrder",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const pass = await GarbaPass.findById(id);

    if (!pass) {
      return res.status(404).json({
        success: false,
        message: "Pass not found",
      });
    }

    if (
      updates.totalQuantity !== undefined &&
      updates.totalQuantity < pass.soldQuantity
    ) {
      return res.status(400).json({
        success: false,
        message: "Total quantity cannot be lower than sold quantity",
      });
    }

    Object.assign(pass, updates);

    await pass.save();

    return res.status(200).json({
      success: true,
      message: "Pass updated successfully",
      data: pass,
    });
  } catch (error) {
    console.error("Update pass error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update pass",
    });
  }
};

export const deletePass = async (req, res) => {
  try {
    const { id } = req.params;

    const pass = await GarbaPass.findById(id);

    if (!pass) {
      return res.status(404).json({
        success: false,
        message: "Pass not found",
      });
    }

    if (pass.soldQuantity > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Pass cannot be deleted after tickets have been sold. Deactivate it instead.",
      });
    }

    await pass.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Pass deleted successfully",
    });
  } catch (error) {
    console.error("Delete pass error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete pass",
    });
  }
};
