import "dotenv/config";
import mongoose from "mongoose";

import connectDatabase from "./config/database.js";
import GarbaEvent from "./models/GarbaEvent.js";
import GarbaPass from "./models/GarbaPass.js";

const seedDatabase = async () => {
  try {
    await connectDatabase();

    console.log("🌱 Starting GarbaPass seed...");

    // Remove only GarbaPass data.
    // Existing AyushFilms collections are NOT touched.
    await GarbaPass.deleteMany({});
    await GarbaEvent.deleteMany({});

    console.log("🧹 Old GarbaPass seed data cleared.");

    // --------------------------------------------------
    // EVENT
    // --------------------------------------------------

    const event = await GarbaEvent.create({
      name: "Dholki Nights 2026",

      slug: "garba-night-2026",

      description:
        "An unforgettable evening of Garba, music, dance and celebration.",

      venue: {
        name: "BHAGAT SHREE MARRIAGE GARDEN",
        address: "Raja Ram Nagar, Dewas, Madhya Pradesh 455001",
        coordinates: {
          latitude: 22.963353,
          longitude: 76.027915,
        },
      },

      eventDate: new Date("2026-10-25T18:00:00+05:30"),

      startTime: "06:00 PM",

      endTime: "11:00 PM",

      bannerImage: "",

      isActive: true,

      bookingOpen: true,

      bookingCloseAt: new Date("2026-10-25T17:00:00+05:30"),
    });

    console.log(`🎉 Event created: ${event.name}`);

    // --------------------------------------------------
    // PASSES
    // --------------------------------------------------

    const passes = await GarbaPass.insertMany([
      {
        event: event._id,

        passType: "SINGLE",

        name: "Single Pass",

        description: "Entry for one person.",

        price: 499,

        currency: "INR",

        membersCount: 1,

        totalQuantity: 500,

        soldQuantity: 0,

        maxPerOrder: 5,

        isActive: true,

        sortOrder: 1,
      },

      {
        event: event._id,

        passType: "COUPLE",

        name: "Couple Pass",

        description: "Entry for two people.",

        price: 899,

        currency: "INR",

        membersCount: 2,

        totalQuantity: 250,

        soldQuantity: 0,

        maxPerOrder: 3,

        isActive: true,

        sortOrder: 2,
      },

      {
        event: event._id,

        passType: "GROUP",

        name: "Group Pass",

        description: "Entry for a group of five people.",

        price: 1999,

        currency: "INR",

        membersCount: 5,

        totalQuantity: 100,

        soldQuantity: 0,

        maxPerOrder: 2,

        isActive: true,

        sortOrder: 3,
      },
    ]);

    console.log(`🎟️ ${passes.length} passes created.`);

    console.log("\n✅ GarbaPass seed completed successfully!");

    console.log("\nEvent:");
    console.log({
      id: event._id.toString(),
      name: event.name,
      slug: event.slug,
    });

    console.log("\nPasses:");

    passes.forEach((pass) => {
      console.log({
        type: pass.passType,
        name: pass.name,
        price: `₹${pass.price}`,
        members: pass.membersCount,
        quantity: pass.totalQuantity,
      });
    });

    await mongoose.connection.close();

    console.log("\n🔌 MongoDB connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seed failed:", error);

    await mongoose.connection.close();

    process.exit(1);
  }
};

seedDatabase();
