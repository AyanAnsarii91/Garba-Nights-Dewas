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

  /* Read referral code persisted by Home.jsx when ?ref= was in the URL */
  const referralCode = sessionStorage.getItem("dholki_ref_code") || "";

  const [quantity, setQuantity] = useState(1);

  const [customerName, setCustomerName] = useState("");

  const [customerPhone, setCustomerPhone] = useState("");

  const [customerEmail, setCustomerEmail] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const availableStock = Math.max(
    0,
    Number(pass?.totalQuantity ?? Infinity) -
      Number(pass?.soldQuantity || 0) -
      Number(pass?.reservedQuantity || 0),
  );
  const maxQuantity = Math.max(
    1,
    Math.min(
      pass?.maxPerOrder || 1,
      availableStock > 0 ? availableStock : pass?.maxPerOrder || 1,
    ),
  );

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

        ...(referralCode ? { referralCode } : {}),
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
      <div className="status-state">
        <div className="status-card">
          <h1 className="text-2xl font-black text-slate-900">
            No pass selected
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Please choose a pass before checking out.
          </p>

          <button
            onClick={() => navigate("/")}
            className="button-primary mt-6"
          >
            Back to event
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="journey-page">
      {/* Background atmosphere */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-150px] top-[-100px] h-96 w-96 rounded-full bg-cyan-200/30 blur-3xl" />

        <div className="absolute bottom-[-150px] right-[-100px] h-96 w-96 rounded-full bg-teal-200/30 blur-3xl" />
      </div>

      <div className="journey-shell">
        {/* Top bar */}
        <div className="journey-topbar">
          <button
            onClick={() => navigate(-1)}
            className="journey-back"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="journey-brand"><span className="brand-mark"><Users size={18} /></span><span><strong>Dholki Nights</strong><small>Secure checkout</small></span></div>
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
          className="journey-intro"
        >
          <p className="journey-kicker">Your night starts here</p>

          <h1 className="journey-title">
            Complete your booking.
          </h1>

          <p className="journey-copy">A few details, then your pass is reserved.</p>
        </motion.div>

        <form
          onSubmit={handleSubmit}
          className="journey-grid"
        >
          {/* Left */}
          <div className="journey-stack">
            {/* Customer details */}
            <section className="journey-panel">
              <div>
                <p className="journey-step">
                  01
                </p>

                <h2 className="journey-subtitle">
                  Your details
                </h2>

                <p className="journey-copy">
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
            <section className="journey-panel">
              <p className="journey-step">
                02
              </p>

              <div className="quantity-row">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    How many passes?
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Maximum {maxQuantity} per order.
                  </p>
                </div>

                <div className="quantity-control">
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
            <div className="journey-trust">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />

              <div>
                <p className="text-sm font-bold text-slate-700">
                  Secure booking
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Your payment will be processed securely through Razorpay Payment Gateway. Your
                  ticket will be generated automatically after verified payment confirmation.
                </p>
              </div>
            </div>
          </div>

          {/* Right summary */}
          <aside className="journey-summary-wrap">
            <div className="journey-summary">
              <div className="summary-head">
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

              <div className="summary-body">
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
                  className="button-primary summary-submit"
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
          className="journey-input"
        />
      </div>
    </label>
  );
}

export default Checkout;
