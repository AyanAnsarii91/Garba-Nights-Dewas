import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  IndianRupee,
  Package,
  RefreshCw,
  ShoppingBag,
  Ticket,
  Users,
} from "lucide-react";

import { getDashboardStats } from "../../services/adminApi";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

const formatNumber = (value) => {
  return new Intl.NumberFormat("en-IN").format(Number(value || 0));
};

const formatDate = (value) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const getPaymentBadgeClass = (status) => {
  switch (status) {
    case "PAID":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";

    case "PENDING":
    case "PROCESSING":
      return "bg-amber-50 text-amber-700 ring-amber-200";

    case "FAILED":
    case "CANCELLED":
    case "REFUNDED":
      return "bg-red-50 text-red-700 ring-red-200";

    default:
      return "bg-slate-50 text-slate-700 ring-slate-200";
  }
};

const StatCard = ({ title, value, subtitle, icon: Icon }) => {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_15px_50px_rgba(15,118,110,0.08)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
};

const passTypeLabel = (passType) => {
  switch (passType) {
    case "SINGLE":
      return "Single";

    case "COUPLE":
      return "Couple";

    case "GROUP":
      return "Group";

    default:
      return passType;
  }
};

const passTypeIcon = (passType) => {
  switch (passType) {
    case "SINGLE":
      return "S";

    case "COUPLE":
      return "C";

    case "GROUP":
      return "G";

    default:
      return "?";
  }
};

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getDashboardStats();

      setDashboard(response?.data || null);
    } catch (error) {
      console.error("Dashboard loading error:", error);

      setError(error.message || "Unable to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-lg">
          <RefreshCw size={20} className="animate-spin text-cyan-600" />

          <span className="text-sm font-medium text-slate-600">
            Loading dashboard...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-bold text-red-800">Dashboard could not load</h2>

            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => loadDashboard(true)}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-red-200 transition hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = dashboard?.stats || {};

  const inventory = dashboard?.inventory || [];

  const revenueBreakdown = dashboard?.revenueBreakdown || [];

  const recentOrders = dashboard?.recentOrders || [];

  const event = dashboard?.event;

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-600">
            Admin Dashboard
          </p>

          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
            {event?.name || "Event overview"}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={15} />

              {event?.eventDate
                ? new Intl.DateTimeFormat("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  }).format(new Date(event.eventDate))
                : "Event date unavailable"}
            </span>

            <span>•</span>

            <span>
              {event?.startTime || "—"} - {event?.endTime || "—"}
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={refreshing}
          onClick={() => loadDashboard(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Primary stats */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          subtitle={`${formatNumber(stats.paidOrders)} paid orders`}
          icon={IndianRupee}
        />

        <StatCard
          title="Passes Sold"
          value={formatNumber(stats.passesSold)}
          subtitle={`of ${formatNumber(stats.totalInventory)} total passes`}
          icon={ShoppingBag}
        />

        <StatCard
          title="Tickets Issued"
          value={formatNumber(stats.ticketsIssued)}
          subtitle="Valid issued tickets"
          icon={Ticket}
        />

        <StatCard
          title="Successful Check-ins"
          value={formatNumber(stats.checkIns)}
          subtitle="Entries scanned at gate"
          icon={CheckCircle2}
        />
      </div>

      {/* Secondary stats */}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_15px_50px_rgba(15,118,110,0.06)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              <Package size={19} />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">
                Available Inventory
              </p>

              <p className="text-xl font-black text-slate-900">
                {formatNumber(stats.availableInventory)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_15px_50px_rgba(15,118,110,0.06)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Activity size={19} />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">
                Reserved Inventory
              </p>

              <p className="text-xl font-black text-slate-900">
                {formatNumber(stats.reservedInventory)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_15px_50px_rgba(15,118,110,0.06)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Users size={19} />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">Entry Rate</p>

              <p className="text-xl font-black text-slate-900">
                {stats.ticketsIssued > 0
                  ? `${Math.round(
                      (stats.checkIns / stats.ticketsIssued) * 100,
                    )}%`
                  : "0%"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue + Inventory */}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Revenue breakdown */}

        <section className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-[0_15px_50px_rgba(15,118,110,0.07)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Revenue by Pass
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Revenue from paid orders only
              </p>
            </div>

            <IndianRupee size={21} className="text-cyan-600" />
          </div>

          <div className="mt-6 space-y-4">
            {revenueBreakdown.map((item) => (
              <div
                key={item.passType}
                className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50/80 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-black text-cyan-700 shadow-sm">
                    {passTypeIcon(item.passType)}
                  </div>

                  <div>
                    <p className="font-bold text-slate-900">
                      {passTypeLabel(item.passType)}
                    </p>

                    <p className="text-xs text-slate-500">
                      {formatNumber(item.quantity)} passes sold
                    </p>
                  </div>
                </div>

                <p className="font-black text-slate-900">
                  {formatCurrency(item.revenue)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Inventory */}

        <section className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-[0_15px_50px_rgba(15,118,110,0.07)]">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Pass Inventory
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current inventory status
            </p>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
            <div className="grid grid-cols-4 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              <span>Pass</span>
              <span>Sold</span>
              <span>Reserved</span>
              <span>Available</span>
            </div>

            {inventory.map((pass) => (
              <div
                key={pass.id}
                className="grid grid-cols-4 items-center border-t border-slate-100 px-4 py-4 text-sm"
              >
                <div>
                  <p className="font-bold text-slate-900">{pass.name}</p>

                  <p className="text-xs text-slate-500">
                    {formatCurrency(pass.price)}
                  </p>
                </div>

                <span className="font-semibold text-slate-700">
                  {formatNumber(pass.soldQuantity)}
                </span>

                <span className="font-semibold text-amber-600">
                  {formatNumber(pass.reservedQuantity)}
                </span>

                <span className="font-bold text-emerald-600">
                  {formatNumber(pass.availableQuantity)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Recent orders */}

      <section className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-[0_15px_50px_rgba(15,118,110,0.07)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Recent Orders</h2>

            <p className="mt-1 text-sm text-slate-500">
              Latest Dholki Nights orders
            </p>
          </div>

          <ShoppingBag size={21} className="text-cyan-600" />
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="px-3 py-3">Order</th>

                <th className="px-3 py-3">Customer</th>

                <th className="px-3 py-3">Pass</th>

                <th className="px-3 py-3">Amount</th>

                <th className="px-3 py-3">Payment</th>

                <th className="px-3 py-3">Date</th>
              </tr>
            </thead>

            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-3 py-10 text-center text-sm text-slate-500"
                  >
                    No orders yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-3 py-4">
                      <span className="font-bold text-slate-900">
                        {order.orderNumber}
                      </span>
                    </td>

                    <td className="px-3 py-4">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {order.customerName}
                        </p>

                        <p className="text-xs text-slate-500">
                          {order.customerPhone}
                        </p>
                      </div>
                    </td>

                    <td className="px-3 py-4">
                      <div className="space-y-1">
                        {order.items?.map((item, index) => (
                          <p
                            key={`${order._id}-${index}`}
                            className="text-sm text-slate-700"
                          >
                            {item.passName} × {item.quantity}
                          </p>
                        ))}
                      </div>
                    </td>

                    <td className="px-3 py-4 font-bold text-slate-900">
                      {formatCurrency(order.totalAmount)}
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${getPaymentBadgeClass(
                          order.paymentStatus,
                        )}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-sm text-slate-500">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
