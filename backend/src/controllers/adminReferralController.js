import GarbaReferral from "../models/GarbaReferral.js";

export const getAdminReferrals = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 20, sort = "recent" } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);
    const pageLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    const filter = {};

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { code: searchRegex },
        { customerName: searchRegex },
        { customerPhone: searchRegex },
        { customerEmail: searchRegex },
      ];
    }

    let sortOptions = { createdAt: -1 };
    if (sort === "visits") {
      sortOptions = { totalVisits: -1, createdAt: -1 };
    } else if (sort === "bookings") {
      sortOptions = { successfulOrders: -1, createdAt: -1 };
    } else if (sort === "orders") {
      sortOptions = { totalOrders: -1, createdAt: -1 };
    }

    const skip = (currentPage - 1) * pageLimit;

    const [referrals, totalCount, summaryAgg] = await Promise.all([
      GarbaReferral.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(pageLimit)
        .lean(),

      GarbaReferral.countDocuments(filter),

      GarbaReferral.aggregate([
        {
          $group: {
            _id: null,
            totalVisits: { $sum: "$totalVisits" },
            totalOrders: { $sum: "$totalOrders" },
            totalSuccessfulBookings: { $sum: "$successfulOrders" },
            totalTicketsSold: { $sum: "$totalTicketsSold" },
          },
        },
      ]),
    ]);

    const topPerformers = await GarbaReferral.find({ successfulOrders: { $gt: 0 } })
      .sort({ successfulOrders: -1, totalVisits: -1 })
      .limit(5)
      .select("code customerName customerPhone totalVisits totalOrders successfulOrders totalTicketsSold")
      .lean();

    const summary = summaryAgg[0] || {
      totalVisits: 0,
      totalOrders: 0,
      totalSuccessfulBookings: 0,
      totalTicketsSold: 0,
    };

    const totalActiveCodes = await GarbaReferral.countDocuments({ isActive: true });

    const enrichedReferrals = referrals.map((ref) => ({
      ...ref,
      conversionRate:
        ref.totalVisits > 0
          ? ((ref.successfulOrders / ref.totalVisits) * 100).toFixed(1)
          : "0.0",
    }));

    return res.status(200).json({
      success: true,
      data: {
        referrals: enrichedReferrals,
        pagination: {
          page: currentPage,
          limit: pageLimit,
          total: totalCount,
          pages: Math.ceil(totalCount / pageLimit),
        },
        stats: {
          totalCodes: totalActiveCodes,
          totalVisits: summary.totalVisits,
          totalOrders: summary.totalOrders,
          totalSuccessfulBookings: summary.totalSuccessfulBookings,
          totalTicketsSold: summary.totalTicketsSold,
        },
        topPerformers,
      },
    });
  } catch (error) {
    console.error("Get admin referrals error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch referral performance data",
    });
  }
};
