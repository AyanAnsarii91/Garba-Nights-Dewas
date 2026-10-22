import GarbaEvent from "../models/GarbaEvent.js";
import GarbaPass from "../models/GarbaPass.js";

export const getEventBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const event = await GarbaEvent.findOne({
      slug,
      isActive: true,
    }).lean();

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const passes = await GarbaPass.find({
      event: event._id,
      isActive: true,
    })
      .sort({ sortOrder: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        event,
        passes,
      },
    });
  } catch (error) {
    console.error("Get event error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch event",
    });
  }
};
