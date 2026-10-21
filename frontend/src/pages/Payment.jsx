import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";

import {
  createPaymentOrder,
  getOrderById,
  reconcilePayment,
} from "../services/api.js";

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();

  const event = location.state?.event;
  const order = location.state?.order;

  const [loading, setLoading] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!order?._id) return;

    if (order.paymentStatus === "PAID") {
      navigate(`/tickets/order/${order._id}`, {
        replace: true,
      });
    }
  }, [order, navigate]);

  const handlePaymentSuccess = () => {
    setLoading(false);
    waitForPayment();
  };

  const startPayment = async () => {
    setError("");

    if (!order?._id) {
      setError("Your order could not be found.");
      return;
    }

    if (!window.Razorpay) {
      setError(
        "Payment service could not be loaded. Please refresh the page and try again.",
      );
      return;
    }

    try {
      setLoading(true);

      const reconciliation = await reconcilePayment(order._id);
      const reconciledOrder = reconciliation.data.order;

      if (reconciledOrder.paymentStatus === "PAID") {
        navigate(`/tickets/order/${reconciledOrder._id}`, {
          replace: true,
        });
        return;
      }

      const currentOrderResponse = await getOrderById(order._id);
      const currentOrder = currentOrderResponse.data.order;

      if (currentOrder.paymentStatus === "PAID") {
        navigate(`/tickets/order/${currentOrder._id}`, {
          replace: true,
        });
        return;
      }

      const response = await createPaymentOrder(order._id);

      const paymentData = response.data;

      const options = {
        key: paymentData.keyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: "GarbaPass",
        description: `${event?.name || "Garba Night"} ticket`,
        order_id: paymentData.razorpayOrderId,

        prefill: {
          name: order.customerName,
          contact: order.customerPhone,
          email: order.customerEmail || undefined,
        },

        theme: {
          color: "#0f766e",
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },

        handler: handlePaymentSuccess,
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        console.error("Razorpay payment failed:", response.error);

        setLoading(false);
        setError(
          response.error?.description || "Payment failed. Please try again.",
        );
      });

      razorpay.open();
    } catch (error) {
      console.error("Payment initialization error:", error);

      setLoading(false);
      setError(error.message || "Unable to start payment. Please try again.");
    }
  };

  const waitForPayment = async () => {
    setCheckingPayment(true);
    setError("");

    const maxAttempts = 15;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const reconciliation = await reconcilePayment(order._id);
        const reconciledOrder = reconciliation.data.order;

        if (reconciledOrder.paymentStatus === "PAID") {
          navigate(`/tickets/order/${reconciledOrder._id}`, {
            replace: true,
          });
          return;
        }

        if (
          ["FAILED", "CANCELLED", "REFUNDED"].includes(
            reconciledOrder.paymentStatus,
          )
        ) {
          setError("The payment was not completed. Please try again.");

          setCheckingPayment(false);
          return;
        }
      } catch (error) {
        console.error("Payment reconciliation polling error:", error);

        try {
          const response = await getOrderById(order._id);
          const updatedOrder = response.data.order;

          if (updatedOrder.paymentStatus === "PAID") {
            navigate(`/tickets/order/${updatedOrder._id}`, {
              replace: true,
            });
            return;
          }
        } catch (orderError) {
          console.error("Order status polling error:", orderError);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    setCheckingPayment(false);

    setError(
      "Payment is still being verified. Please wait a moment before trying again.",
    );
  };

  if (!event || !order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#ecfffd] p-6">
        <div className="rounded-[2rem] border border-white/70 bg-white/60 p-8 text-center shadow-xl backdrop-blur-2xl">
          <h1 className="text-2xl font-black text-slate-900">
            Payment session not found
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Please start your booking again.
          </p>

          <button
            onClick={() => navigate("/")}
            className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Back to event
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#ecfffd] px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-150px] top-[-100px] h-96 w-96 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute right-[-120px] top-[30%] h-96 w-96 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute bottom-[-150px] left-[30%] h-96 w-96 rounded-full bg-teal-200/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-8 inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/55 px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur-xl transition hover:bg-white/80"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">
            Final step
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Complete your payment.
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
            Your pass is reserved temporarily. Complete payment to confirm your
            booking.
          </p>
        </motion.div>

        <div className="mx-auto mt-10 max-w-3xl">
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/60 shadow-[0_25px_80px_rgba(15,118,110,0.1)] backdrop-blur-2xl"
          >
            <div className="bg-gradient-to-br from-teal-400/90 via-cyan-300/80 to-sky-200/80 p-8 text-white sm:p-10">
              <div className="flex items-center justify-between gap-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">
                    Amount payable
                  </p>

                  <p className="mt-2 text-5xl font-black tracking-tight">
                    ₹{order.totalAmount}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-md">
                  <LockKeyhole className="h-7 w-7" />
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-3">
                <InfoCard
                  icon={Clock3}
                  label="Order"
                  value={order.orderNumber}
                />

                <InfoCard icon={CheckCircle2} label="Status" value="Reserved" />

                <InfoCard icon={ShieldCheck} label="Payment" value="Razorpay" />
              </div>

              {error && (
                <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium leading-6 text-red-600">
                  {error}
                </div>
              )}

              {checkingPayment && (
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
                  <span className="mt-0.5 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-teal-200 border-t-teal-700" />

                  <div>
                    <p className="text-sm font-bold text-slate-700">
                      Verifying your payment
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      We're waiting for secure payment confirmation. Don't
                      refresh this page yet.
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={startPayment}
                disabled={loading || checkingPayment}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Opening secure payment...
                  </>
                ) : checkingPayment ? (
                  "Verifying payment..."
                ) : (
                  <>
                    Pay ₹{order.totalAmount}
                    <LockKeyhole className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="h-4 w-4 text-teal-500" />
                Secure payment powered by Razorpay
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
    <div className="rounded-2xl border border-white/80 bg-white/55 p-4 backdrop-blur-xl">
      <Icon className="h-5 w-5 text-teal-600" />

      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-bold text-slatse-800">{value}</p>
    </div>
  );
}

export default Payment;
