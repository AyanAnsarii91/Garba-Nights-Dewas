import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { motion } from "motion/react";

import {
  createPaymentOrder,
  verifyPayment,
  getOrderById,
  reconcilePayment,
  getEventBySlug,
} from "../services/api.js";

// Helper to ensure Razorpay checkout script is loaded
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const queryOrderId = searchParams.get("orderId");
  const stateOrder = location.state?.order;
  const stateEvent = location.state?.event;

  const [order, setOrder] = useState(stateOrder || null);
  const [event, setEvent] = useState(stateEvent || null);
  const [loading, setLoading] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [error, setError] = useState("");
  const isPollingRef = useRef(false);

  // Load order from query params if page reloaded or opened via link
  useEffect(() => {
    let isMounted = true;

    const loadOrderData = async () => {
      const activeOrderId = queryOrderId || stateOrder?._id;

      if (!activeOrderId) return;

      try {
        const orderRes = await getOrderById(activeOrderId);
        if (!isMounted) return;

        const fetchedOrder = orderRes.data?.order;
        if (fetchedOrder) {
          setOrder((prev) => ({ ...(prev || {}), ...fetchedOrder }));

          if (fetchedOrder.paymentStatus === "PAID") {
            navigate(`/tickets/order/${fetchedOrder._id}`, { replace: true });
            return;
          }
        }

        if (!event) {
          const eventRes = await getEventBySlug("garba-night-2026").catch(() => null);
          if (isMounted && eventRes?.data?.event) {
            setEvent(eventRes.data.event);
          }
        }
      } catch (err) {
        console.error("Error loading order on payment page:", err);
      }
    };

    loadOrderData();

    return () => {
      isMounted = false;
    };
  }, [queryOrderId, stateOrder?._id, navigate, event]);

  // Polling function for verifying payment confirmation
  const waitForPayment = useCallback(
    async (orderIdToVerify) => {
      const targetId = orderIdToVerify || order?._id || queryOrderId;
      if (!targetId || isPollingRef.current) return;

      isPollingRef.current = true;
      setCheckingPayment(true);
      setError("");

      const maxAttempts = 15;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const reconciliation = await reconcilePayment(targetId);
          const reconciledOrder = reconciliation.data?.order;

          if (reconciledOrder?.paymentStatus === "PAID") {
            isPollingRef.current = false;
            navigate(`/tickets/order/${reconciledOrder._id}`, {
              replace: true,
            });
            return;
          }

          if (
            ["FAILED", "CANCELLED", "REFUNDED"].includes(
              reconciledOrder?.paymentStatus,
            )
          ) {
            isPollingRef.current = false;
            setCheckingPayment(false);
            setError(
              "The payment was not completed or was cancelled. Please try again.",
            );
            return;
          }
        } catch (err) {
          console.error("Payment reconciliation polling error:", err);
        }

        // Wait 2 seconds before next poll
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      isPollingRef.current = false;
      setCheckingPayment(false);
      setError(
        "Payment verification is taking longer than expected. If your account was debited, please refresh in a moment to view your ticket.",
      );
    },
    [order?._id, queryOrderId, navigate],
  );

  // If order was already paid, navigate immediately
  useEffect(() => {
    if (order?.paymentStatus === "PAID") {
      navigate(`/tickets/order/${order._id}`, {
        replace: true,
      });
    }
  }, [order?.paymentStatus, order?._id, navigate]);

  // Initiate Razorpay Standard Checkout
  const startPayment = async () => {
    setError("");

    const targetOrderId = order?._id || queryOrderId;

    if (!targetOrderId) {
      setError("Your order could not be found. Please start your booking again.");
      return;
    }

    try {
      setLoading(true);

      // Check if already paid first
      const reconciliation = await reconcilePayment(targetOrderId);
      const reconciledOrder = reconciliation.data?.order;

      if (reconciledOrder?.paymentStatus === "PAID") {
        navigate(`/tickets/order/${reconciledOrder._id}`, {
          replace: true,
        });
        return;
      }

      // Ensure Razorpay script is ready
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady || !window.Razorpay) {
        throw new Error(
          "Payment gateway could not be loaded. Please check your internet connection and try again.",
        );
      }

      // Backend STEP 1: Create Razorpay Order
      const response = await createPaymentOrder(targetOrderId);
      const paymentData = response.data;

      if (!paymentData?.order_id && !paymentData?.razorpayOrderId) {
        throw new Error(
          response.message || "Failed to create Razorpay payment order",
        );
      }

      const razorpayOrderId = paymentData.order_id || paymentData.razorpayOrderId;
      const razorpayKey =
        paymentData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;

      // STEP 2: Open Razorpay Checkout modal
      const options = {
        key: razorpayKey,
        amount: paymentData.amount,
        currency: paymentData.currency || "INR",
        name: "Dholki Nights",
        description: `${event?.name || "Garba Night"} Entry Pass`,
        order_id: razorpayOrderId,
        prefill: {
          name: order?.customerName || "",
          contact: order?.customerPhone || "",
          email: order?.customerEmail || undefined,
        },
        theme: {
          color: "#0f766e",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        // STEP 3: Handle payment success callback from modal
        handler: async (paymentResponse) => {
          setLoading(false);
          setCheckingPayment(true);

          try {
            // Verify HMAC-SHA256 signature server-side
            const verifyRes = await verifyPayment({
              orderId: targetOrderId,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });

            if (
              verifyRes.success &&
              verifyRes.data?.order?.paymentStatus === "PAID"
            ) {
              setCheckingPayment(false);
              navigate(`/tickets/order/${verifyRes.data.order._id || targetOrderId}`, {
                replace: true,
              });
              return;
            }

            // Fallback to reconciliation polling if async verification in progress
            waitForPayment(targetOrderId);
          } catch (verifyError) {
            console.error("Server payment verification error:", verifyError);
            waitForPayment(targetOrderId);
          }
        },
      };

      const rzpInstance = new window.Razorpay(options);

      rzpInstance.on("payment.failed", (failedResponse) => {
        console.error("Razorpay payment failed:", failedResponse.error);
        setLoading(false);
        setCheckingPayment(false);
        setError(
          failedResponse.error?.description ||
            "Payment failed or was declined. Please try again.",
        );
      });

      rzpInstance.open();
    } catch (err) {
      console.error("Payment initiation error:", err);
      setLoading(false);
      setCheckingPayment(false);
      setError(
        err.message || "Unable to start Razorpay payment. Please try again.",
      );
    }
  };

  if (!order && !queryOrderId) {
    return (
      <main className="status-state">
        <div className="status-card">
          <h1>Payment session not found</h1>
          <p>Please start your booking again.</p>
          <button onClick={() => navigate("/")} className="button-primary mt-6">
            Back to event
          </button>
        </div>
      </main>
    );
  }

  const payableAmount = order?.totalAmount ?? "—";

  return (
    <main className="journey-page payment-page">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-150px] top-[-100px] h-96 w-96 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute right-[-120px] top-[30%] h-96 w-96 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute bottom-[-150px] left-[30%] h-96 w-96 rounded-full bg-teal-200/30 blur-3xl" />
      </div>

      <div className="journey-shell payment-shell">
        <button
          onClick={() => navigate(-1)}
          className="journey-back payment-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="journey-intro payment-intro"
        >
          <p className="journey-kicker">Final step</p>
          <h1 className="journey-title">Complete your payment.</h1>
          <p className="journey-copy">
            Your pass is reserved temporarily. Pay securely with Razorpay (UPI,
            Cards, NetBanking, Wallets) to confirm your booking.
          </p>
        </motion.div>

        <div className="mx-auto mt-10 max-w-3xl">
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="journey-summary payment-summary"
          >
            <div className="summary-head payment-amount">
              <div className="flex items-center justify-between gap-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">
                    Amount payable
                  </p>

                  <p className="mt-2 text-5xl font-black tracking-tight">
                    ₹{payableAmount}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-md">
                  <LockKeyhole className="h-7 w-7" />
                </div>
              </div>
            </div>

            <div className="summary-body">
              <div className="payment-info-grid">
                <InfoCard
                  icon={Clock3}
                  label="Order"
                  value={order?.orderNumber || "Processing"}
                />

                <InfoCard
                  icon={CheckCircle2}
                  label="Status"
                  value={
                    order?.paymentStatus === "PAID"
                      ? "Paid"
                      : order?.paymentStatus === "FAILED"
                        ? "Failed"
                        : "Reserved"
                  }
                />

                <InfoCard
                  icon={CreditCard}
                  label="Gateway"
                  value="Razorpay"
                />
              </div>

              {error && (
                <div role="alert" className="payment-alert">
                  {error}
                </div>
              )}

              {checkingPayment && (
                <div className="payment-pending">
                  <span className="mt-0.5 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-teal-200 border-t-teal-700" />

                  <div>
                    <p className="text-sm font-bold text-slate-700">
                      Verifying your payment with Razorpay
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      We're waiting for secure server confirmation. Don't
                      refresh this page yet.
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={startPayment}
                disabled={loading || checkingPayment}
                className="button-primary summary-submit payment-submit"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Opening Razorpay Checkout...
                  </>
                ) : checkingPayment ? (
                  "Verifying payment..."
                ) : (
                  <>
                    Pay ₹{payableAmount} via Razorpay
                    <LockKeyhole className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="h-4 w-4 text-teal-500" />
                <span>
                  Secure payment powered by <strong>Razorpay</strong> · Supports
                  UPI (GPay, PhonePe, Paytm), Cards & NetBanking
                </span>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="payment-info-card">
      <Icon className="h-5 w-5 text-teal-600" />

      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}

export default Payment;
