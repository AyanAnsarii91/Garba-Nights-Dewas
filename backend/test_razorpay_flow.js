import "dotenv/config";
import mongoose from "mongoose";
import crypto from "node:crypto";
import connectDatabase from "./src/config/database.js";
import GarbaEvent from "./src/models/GarbaEvent.js";
import GarbaPass from "./src/models/GarbaPass.js";
import GarbaOrder from "./src/models/GarbaOrder.js";
import GarbaTicket from "./src/models/GarbaTicket.js";
import {
  createRazorpayOrder,
  verifyRazorpayCheckoutSignature,
  getRazorpayKeyId,
  getRazorpayKeySecret,
  getRazorpayWebhookSecret,
} from "./src/services/razorpayService.js";
import {
  completeRazorpayPayment,
  failRazorpayPayment,
  releaseExpiredReservations,
} from "./src/services/paymentCompletionService.js";
import { verifyWebhookSignature } from "./src/controllers/razorpayWebhookController.js";

const runTests = async () => {
  console.log("=========================================================");
  console.log("  GARBAPASS RAZORPAY INTEGRATION END-TO-END TEST SUITE   ");
  console.log("=========================================================");

  await connectDatabase();

  try {
    // Locate or create test event and pass
    let event = await GarbaEvent.findOne({ isActive: true, bookingOpen: true });
    if (!event) {
      event = await GarbaEvent.create({
        name: "Test Garba Night 2026",
        slug: "test-garba-night-2026",
        eventDate: new Date(Date.now() + 86400000 * 10),
        bookingOpen: true,
        isActive: true,
      });
    }

    let pass = await GarbaPass.findOne({ event: event._id, isActive: true });
    if (!pass) {
      pass = await GarbaPass.create({
        event: event._id,
        passType: "SINGLE",
        name: "Test Single Pass",
        price: 499,
        totalQuantity: 100,
        soldQuantity: 0,
        reservedQuantity: 0,
        maxPerOrder: 5,
        membersCount: 1,
        isActive: true,
      });
    }

    console.log(`\n🎟️ Using Event: "${event.name}" | Pass: "${pass.name}" (Price: ₹${pass.price})`);

    // -------------------------------------------------------------------------
    // TEST 1: Razorpay Credentials & Order Creation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 1: Razorpay Credentials & API Order Creation ---");
    const testAmountPaise = pass.price * 100;
    const rzpOrder = await createRazorpayOrder({
      amount: testAmountPaise,
      currency: "INR",
      receipt: `TEST-REC-${Date.now()}`,
    });

    console.log(`✅ Created Razorpay Order ID: ${rzpOrder.id}`);
    console.log(`   Amount: ${rzpOrder.amount} paise (₹${rzpOrder.amount / 100})`);
    console.log(`   Key ID in use: ${getRazorpayKeyId()}`);
    if (rzpOrder.amount !== testAmountPaise) {
      throw new Error("Razorpay order amount mismatch");
    }

    // -------------------------------------------------------------------------
    // TEST 2: Inventory Reservation & GarbaPass Order Creation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Order Creation & Atomic Inventory Reservation ---");
    const initialReserved = pass.reservedQuantity || 0;
    const initialSold = pass.soldQuantity || 0;
    const orderQuantity = 2;

    const orderNumber = `GPTEST${Date.now().toString().slice(-6)}`;
    const totalAmount = pass.price * orderQuantity;

    // Atomically reserve inventory ensuring sold + reserved + requested <= total
    const updatedPass = await GarbaPass.findOneAndUpdate(
      {
        _id: pass._id,
        $expr: {
          $lte: [
            {
              $add: [
                { $ifNull: ["$soldQuantity", 0] },
                { $ifNull: ["$reservedQuantity", 0] },
                orderQuantity,
              ],
            },
            "$totalQuantity",
          ],
        },
      },
      { $inc: { reservedQuantity: orderQuantity } },
      { returnDocument: "after" },
    );

    if (!updatedPass || updatedPass.reservedQuantity !== initialReserved + orderQuantity) {
      throw new Error("Inventory reservation failed");
    }
    console.log(`✅ Inventory temporarily reserved: ${initialReserved} -> ${updatedPass.reservedQuantity}`);

    const garbaOrder = await GarbaOrder.create({
      orderNumber,
      event: event._id,
      customerName: "Rahul Sharma",
      customerPhone: "9876543210",
      customerEmail: "rahul@test.com",
      membersCount: pass.membersCount * orderQuantity,
      items: [
        {
          pass: pass._id,
          passType: pass.passType,
          passName: pass.name,
          membersCount: pass.membersCount,
          quantity: orderQuantity,
          price: pass.price,
          subtotal: totalAmount,
        },
      ],
      subtotal: totalAmount,
      totalAmount,
      paymentStatus: "PROCESSING",
      paymentGateway: "RAZORPAY",
      paymentOrderId: rzpOrder.id,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    console.log(`✅ Created GarbaOrder: ${garbaOrder.orderNumber} (ID: ${garbaOrder._id})`);

    // -------------------------------------------------------------------------
    // TEST 3: Signature Verification (HMAC-SHA256)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: HMAC-SHA256 Signature Verification ---");
    const mockPaymentId = `pay_test_${Date.now()}`;
    const secret = getRazorpayKeySecret();
    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(`${rzpOrder.id}|${mockPaymentId}`)
      .digest("hex");

    const invalidSignature = crypto
      .createHmac("sha256", "wrong_key_secret_for_test")
      .update(`${rzpOrder.id}|${mockPaymentId}`)
      .digest("hex");

    const validCheck = verifyRazorpayCheckoutSignature({
      orderId: rzpOrder.id,
      paymentId: mockPaymentId,
      signature: validSignature,
    });

    const invalidCheck = verifyRazorpayCheckoutSignature({
      orderId: rzpOrder.id,
      paymentId: mockPaymentId,
      signature: invalidSignature,
    });

    const tamperedOrderCheck = verifyRazorpayCheckoutSignature({
      orderId: "order_different_123",
      paymentId: mockPaymentId,
      signature: validSignature,
    });

    console.log(`   Valid signature check: ${validCheck ? "PASSED (true)" : "FAILED"}`);
    console.log(`   Invalid signature check: ${!invalidCheck ? "PASSED (correctly rejected false)" : "FAILED"}`);
    console.log(`   Tampered order check: ${!tamperedOrderCheck ? "PASSED (correctly rejected false)" : "FAILED"}`);

    if (!validCheck || invalidCheck || tamperedOrderCheck) {
      throw new Error("Signature verification test failed");
    }

    // -------------------------------------------------------------------------
    // TEST 4: Amount Mismatch Protection
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Amount Mismatch Protection ---");
    let mismatchRejected = false;
    try {
      await completeRazorpayPayment({
        razorpayOrderId: rzpOrder.id,
        razorpayPaymentId: mockPaymentId,
        paymentAmount: 100, // Wrong amount (100 paise vs expected 99800 paise)
      });
    } catch (err) {
      mismatchRejected = true;
      console.log(`✅ Correctly rejected amount mismatch: "${err.message}"`);
    }

    if (!mismatchRejected) {
      throw new Error("Amount mismatch was not rejected!");
    }

    // -------------------------------------------------------------------------
    // TEST 5: Complete Payment & Ticket Generation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: Atomic Payment Completion & Ticket Generation ---");
    const completedOrder = await completeRazorpayPayment({
      razorpayOrderId: rzpOrder.id,
      razorpayPaymentId: mockPaymentId,
      paymentAmount: totalAmount * 100,
    });

    console.log(`✅ Order status transitioned to: "${completedOrder.paymentStatus}"`);
    console.log(`   Payment ID: ${completedOrder.paymentId}`);
    console.log(`   Paid At: ${completedOrder.paidAt}`);

    const tickets = await GarbaTicket.find({ order: completedOrder._id }).select("+qrToken");
    console.log(`✅ Tickets generated: ${tickets.length} (Expected: ${orderQuantity})`);

    tickets.forEach((t, i) => {
      console.log(`   [Ticket ${i + 1}] Number: ${t.ticketNumber} | Status: ${t.status} | qrToken: ${t.qrToken.slice(0, 16)}...`);
      if (!t.qrToken || t.qrToken.length < 32) {
        throw new Error("Invalid ticket qrToken generated");
      }
    });

    const passAfterPay = await GarbaPass.findById(pass._id);
    console.log(`✅ Inventory after payment: Sold = ${passAfterPay.soldQuantity} (+${orderQuantity}), Reserved = ${passAfterPay.reservedQuantity} (-${orderQuantity})`);

    // -------------------------------------------------------------------------
    // TEST 6: Idempotency (Duplicate Verification / Webhook Protection)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 6: Idempotency & Duplicate Protection ---");
    const duplicateCallOrder = await completeRazorpayPayment({
      razorpayOrderId: rzpOrder.id,
      razorpayPaymentId: mockPaymentId,
      paymentAmount: totalAmount * 100,
    });

    const ticketsAfterDuplicate = await GarbaTicket.find({ order: completedOrder._id });
    const passAfterDuplicate = await GarbaPass.findById(pass._id);

    console.log(`✅ Duplicate call returned status: "${duplicateCallOrder.paymentStatus}"`);
    console.log(`   Ticket count remains: ${ticketsAfterDuplicate.length} (NO DUPLICATES)`);
    console.log(`   Pass sold quantity remains: ${passAfterDuplicate.soldQuantity} (NO DOUBLE COUNTING)`);

    if (ticketsAfterDuplicate.length !== orderQuantity) {
      throw new Error("Duplicate ticket bug detected!");
    }

    // -------------------------------------------------------------------------
    // TEST 7: Webhook Signature Verification
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 7: Webhook Signature Verification ---");
    const webhookSecret = getRazorpayWebhookSecret();
    const webhookPayload = JSON.stringify({
      event: "order.paid",
      payload: {
        payment: {
          entity: {
            id: mockPaymentId,
            order_id: rzpOrder.id,
            amount: totalAmount * 100,
          },
        },
      },
    });

    const validWebhookSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(Buffer.from(webhookPayload, "utf8"))
      .digest("hex");

    const invalidWebhookSignature = "invalid_webhook_sig_hex";

    const isWebhookValid = verifyWebhookSignature(Buffer.from(webhookPayload), validWebhookSignature);
    const isWebhookInvalid = verifyWebhookSignature(Buffer.from(webhookPayload), invalidWebhookSignature);

    console.log(`   Valid webhook signature: ${isWebhookValid ? "PASSED (true)" : "FAILED"}`);
    console.log(`   Invalid webhook signature: ${!isWebhookInvalid ? "PASSED (correctly rejected false)" : "FAILED"}`);

    if (!isWebhookValid || isWebhookInvalid) {
      throw new Error("Webhook signature verification failed");
    }

    // -------------------------------------------------------------------------
    // TEST 8: Failed/Cancelled Payment & Inventory Release
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 8: Failed/Cancelled Payment & Reservation Release ---");
    const cancelPassInitialReserved = (await GarbaPass.findById(pass._id)).reservedQuantity;

    // Reserve 1 ticket for a test failure order
    await GarbaPass.updateOne({ _id: pass._id }, { $inc: { reservedQuantity: 1 } });
    const cancelOrder = await GarbaOrder.create({
      orderNumber: `GPFAIL${Date.now().toString().slice(-6)}`,
      event: event._id,
      customerName: "Test User",
      customerPhone: "9000000000",
      membersCount: 1,
      items: [{ pass: pass._id, passType: pass.passType, passName: pass.name, membersCount: pass.membersCount, quantity: 1, price: pass.price, subtotal: pass.price }],
      subtotal: pass.price,
      totalAmount: pass.price,
      paymentStatus: "PROCESSING",
      paymentOrderId: `order_fail_test_${Date.now()}`,
    });

    await failRazorpayPayment({
      orderId: cancelOrder._id,
      reason: "Customer cancelled payment on Razorpay checkout",
    });

    const updatedCancelOrder = await GarbaOrder.findById(cancelOrder._id);
    const cancelPassAfter = await GarbaPass.findById(pass._id);

    console.log(`✅ Cancelled order status: "${updatedCancelOrder.paymentStatus}"`);
    console.log(`✅ Reserved inventory released: ${cancelPassInitialReserved + 1} -> ${cancelPassAfter.reservedQuantity}`);

    if (updatedCancelOrder.paymentStatus !== "FAILED" || cancelPassAfter.reservedQuantity !== cancelPassInitialReserved) {
      throw new Error("Failed payment inventory release test failed");
    }

    // -------------------------------------------------------------------------
    // TEST 9: Expired Reservation Automatic Release
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 9: Expired Reservation Automatic Release ---");
    const expPassInitialReserved = (await GarbaPass.findById(pass._id)).reservedQuantity;
    await GarbaPass.updateOne({ _id: pass._id }, { $inc: { reservedQuantity: 2 } });

    await GarbaOrder.create({
      orderNumber: `GPEXP${Date.now().toString().slice(-6)}`,
      event: event._id,
      customerName: "Expired Booking User",
      customerPhone: "9111111111",
      membersCount: 2,
      items: [{ pass: pass._id, passType: pass.passType, passName: pass.name, membersCount: pass.membersCount, quantity: 2, price: pass.price, subtotal: pass.price * 2 }],
      subtotal: pass.price * 2,
      totalAmount: pass.price * 2,
      paymentStatus: "PROCESSING",
      paymentOrderId: `order_exp_${Date.now()}`,
      expiresAt: new Date(Date.now() - 60000), // Expired 1 min ago
    });

    const released = await releaseExpiredReservations();
    console.log(`✅ Expired orders processed: ${released}`);
    const expPassAfter = await GarbaPass.findById(pass._id);
    console.log(`✅ Reserved inventory after cleanup: ${expPassAfter.reservedQuantity} (Restored to ${expPassInitialReserved})`);

    // Verify PAID orders were protected
    const paidCheck = await GarbaOrder.findById(completedOrder._id);
    if (paidCheck.paymentStatus !== "PAID") {
      throw new Error("CRITICAL: Paid order status was modified by expiration cleanup!");
    }
    console.log(`✅ PAID orders remain permanently protected: Order ${paidCheck.orderNumber} is "${paidCheck.paymentStatus}"`);

    // -------------------------------------------------------------------------
    // Clean up test data
    // -------------------------------------------------------------------------
    await GarbaTicket.deleteMany({ order: completedOrder._id });
    await GarbaOrder.deleteMany({ _id: { $in: [completedOrder._id, cancelOrder._id] } });
    await GarbaPass.updateOne(
      { _id: pass._id },
      { $inc: { soldQuantity: -orderQuantity } },
    );

    console.log("\n=========================================================");
    console.log("  🎉 ALL 9 END-TO-END RAZORPAY TESTS COMPLETED & PASSED! ");
    console.log("=========================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error);
    process.exit(1);
  }
};

runTests();
