import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { motion } from "motion/react";

import { createOrder } from "../services/api.js";

function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();

  const event = location.state?.event;
  const pass = location.state?.pass;

  const [quantity, setQuantity] = useState(1);

  const [customerName, setCustomerName] = useState("");

  const [customerPhone, setCustomerPhone] = useState("");

  const [customerEmail, setCustomerEmail] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const maxQuantity = pass?.maxPerOrder || 1;

  const subtotal = useMemo(() => {
    if (!pass) return 0;

    return pass.price * quantity;
  }, [pass, quantity]);

  const handleQuantityChange = (value) => {
    const nextQuantity = Math.max(1, Math.min(maxQuantity, Number(value) || 1));

    setQuantity(nextQuantity);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!event || !pass) {
      setError("Your selected pass could not be found.");
      return;
    }

    if (!customerName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(customerPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await createOrder({
        eventId: event._id,

        customerName: customerName.trim(),

        customerPhone: customerPhone.trim(),

        customerEmail: customerEmail.trim(),

        items: [
          {
            passId: pass._id,
            quantity,
          },
        ],
      });

      navigate("/payment", {
        state: {
          event,
          order: response.data.order,
        },
      });
    } catch (error) {
      console.error("Order creation error:", error);

      setError(
        error.message || "Unable to create your order. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!event || !pass) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ecfffd] p-6">
        <div className="rounded-[2rem] border border-white/70 bg-white/60 p-8 text-center shadow-xl backdrop-blur-2xl">
          <h1 className="text-2xl font-black text-slate-900">
            No pass selected
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Please choose a pass before checking out.
          </p>

          <button
            onClick={() => navigate("/")}
            className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Back to event
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#ecfffd] px-4 py-6 sm:px-6 lg:px-8">
      {/* Background atmosphere */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-150px] top-[-100px] h-96 w-96 rounded-full bg-cyan-200/30 blur-3xl" />

        <div className="absolute bottom-[-150px] right-[-100px] h-96 w-96 rounded-full bg-teal-200/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* Top bar */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/55 px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur-xl transition hover:bg-white/80"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">
              GarbaPass
            </p>

            <p className="text-xs text-slate-400">Secure checkout</p>
          </div>
        </div>

        {/* Heading */}
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">
            Almost there
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Complete your booking.
          </h1>

          <p className="mt-3 text-sm text-slate-500 sm:text-base">
            Enter your details and secure your GarbaPass.
          </p>
        </motion.div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 grid gap-6 lg:grid-cols-[1fr_380px]"
        >
          {/* Left */}
          <div className="space-y-6">
            {/* Customer details */}
            <section className="rounded-[2rem] border border-white/70 bg-white/55 p-6 shadow-[0_20px_70px_rgba(15,118,110,0.07)] backdrop-blur-2xl sm:p-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-600">
                  01
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-900">
                  Your details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  We'll use these details for your ticket.
                </p>
              </div>

              <div className="mt-7 space-y-5">
                <InputField
                  icon={User}
                  label="Full name"
                  placeholder="Enter your full name"
                  value={customerName}
                  onChange={setCustomerName}
                  required
                />

                <InputField
                  icon={Phone}
                  label="Mobile number"
                  placeholder="10-digit mobile number"
                  value={customerPhone}
                  onChange={setCustomerPhone}
                  type="tel"
                  required
                />

                <InputField
                  icon={Mail}
                  label="Email address"
                  placeholder="you@example.com"
                  value={customerEmail}
                  onChange={setCustomerEmail}
                  type="email"
                  optional
                />
              </div>
            </section>

            {/* Quantity */}
            <section className="rounded-[2rem] border border-white/70 bg-white/55 p-6 shadow-[0_20px_70px_rgba(15,118,110,0.07)] backdrop-blur-2xl sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-600">
                02
              </p>

              <div className="mt-2 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    How many passes?
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Maximum {maxQuantity} per order.
                  </p>
                </div>

                <div className="flex items-center rounded-2xl border border-white/80 bg-white/70 p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-xl font-medium text-slate-600 transition hover:bg-white disabled:opacity-30"
                  >
                    −
                  </button>

                  <span className="flex h-11 w-12 items-center justify-center text-lg font-black text-slate-900">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= maxQuantity}
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-xl font-medium text-slate-600 transition hover:bg-white disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
            </section>

            {/* Trust */}
            <div className="flex items-start gap-3 rounded-2xl border border-teal-100/80 bg-teal-50/50 p-4 backdrop-blur-xl">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />

              <div>
                <p className="text-sm font-bold text-slate-700">
                  Secure booking
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Your payment will be processed securely through Razorpay. Your
                  ticket will be generated after successful payment
                  verification.
                </p>
              </div>
            </div>
          </div>

          {/* Right summary */}
          <aside className="lg:sticky lg:top-6 lg:h-fit">
            <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/60 shadow-[0_25px_80px_rgba(15,118,110,0.1)] backdrop-blur-2xl">
              <div className="bg-gradient-to-br from-teal-400/90 via-cyan-300/80 to-sky-200/80 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">
                      Your pass
                    </p>

                    <h2 className="mt-2 text-2xl font-black text-white">
                      {pass.name}
                    </h2>
                  </div>

                  <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-md">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                </div>

                <div className="mt-8">
                  <p className="text-sm text-white/75">
                    {pass.membersCount}{" "}
                    {pass.membersCount === 1 ? "person" : "people"} per pass
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white">
                    {event.name}
                  </p>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      ₹{pass.price} × {quantity}
                    </span>

                    <span className="font-semibold text-slate-800">
                      ₹{subtotal}
                    </span>
                  </div>

                  <div className="h-px bg-slate-200/70" />

                  <div className="flex items-end justify-between">
                    <span className="text-sm font-semibold text-slate-500">
                      Total
                    </span>

                    <span className="text-3xl font-black tracking-tight text-slate-950">
                      ₹{subtotal}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Creating booking...
                    </>
                  ) : (
                    <>
                      Continue to payment
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p className="mt-4 text-center text-[11px] leading-5 text-slate-400">
                  By continuing, you agree that your booking details will be
                  used to process your event ticket.
                </p>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}

function InputField({
  icon: Icon,
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
  optional = false,
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{label}</span>

        {optional && <span className="text-xs text-slate-400">Optional</span>}
      </div>

      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-14 w-full rounded-2xl border border-white/80 bg-white/65 pl-12 pr-4 text-sm font-medium text-slate-800 outline-none backdrop-blur-xl transition placeholder:text-slate-400 focus:border-teal-300 focus:bg-white/85 focus:ring-4 focus:ring-teal-100/60"
        />
      </div>
    </label>
  );
}

export default Checkout;
