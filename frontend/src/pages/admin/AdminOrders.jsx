import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";

import { getAdminOrderById, getAdminOrders } from "../../services/adminApi";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

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

const statusClass = (status) => {
  if (status === "PAID") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (status === "PENDING" || status === "PROCESSING") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  return "bg-red-50 text-red-700 ring-red-200";
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [detailLoading, setDetailLoading] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminOrders({
        status,
        search,
        page,
        limit: 20,
      });

      setOrders(response?.data?.orders || []);

      setPagination(response?.data?.pagination || null);
    } catch (error) {
      console.error("Orders loading error:", error);

      setError(error.message || "Unable to load orders");
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const openOrder = async (orderId) => {
    try {
      setDetailLoading(true);

      const response = await getAdminOrderById(orderId);

      setSelectedOrder(response?.data?.order || null);
    } catch (error) {
      setError(error.message || "Unable to load order");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-600">
          Sales
        </p>

        <h1 className="mt-1 text-3xl font-black text-slate-900">Orders</h1>

        <p className="mt-2 text-sm text-slate-500">
          View and manage GarbaPass customer orders.
        </p>
      </div>

      <div className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-[0_15px_50px_rgba(15,118,110,0.07)]">
        <div className="flex flex-col gap-3 lg:flex-row">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order, customer, phone or pass..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-50"
            />
          </form>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-cyan-400"
          >
            <option value="">All payments</option>

            <option value="PAID">Paid</option>

            <option value="PENDING">Pending</option>

            <option value="PROCESSING">Processing</option>

            <option value="FAILED">Failed</option>

            <option value="CANCELLED">Cancelled</option>

            <option value="REFUNDED">Refunded</option>
          </select>

          <button
            type="button"
            onClick={loadOrders}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-cyan-300 hover:text-cyan-700"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/75 shadow-[0_15px_50px_rgba(15,118,110,0.07)]">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <RefreshCw size={22} className="animate-spin text-cyan-600" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600">{error}</div>
        ) : orders.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <ShoppingBag size={40} className="text-slate-300" />

            <p className="mt-3 font-bold text-slate-700">No orders found</p>

            <p className="mt-1 text-sm text-slate-500">
              Try another search or filter.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4">Order</th>

                    <th className="px-5 py-4">Customer</th>

                    <th className="px-5 py-4">Pass</th>

                    <th className="px-5 py-4">Amount</th>

                    <th className="px-5 py-4">Payment</th>

                    <th className="px-5 py-4">Created</th>

                    <th className="px-5 py-4" />
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order._id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">
                          {order.orderNumber}
                        </p>

                        <p className="text-xs text-slate-500">
                          {order.items?.reduce(
                            (sum, item) => sum + Number(item.quantity || 0),
                            0,
                          )}{" "}
                          pass(es)
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {order.customerName}
                        </p>

                        <p className="text-xs text-slate-500">
                          {order.customerPhone}
                        </p>
                      </td>

                      <td className="px-5 py-4">
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

                      <td className="px-5 py-4 font-black text-slate-900">
                        {formatCurrency(order.totalAmount)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusClass(
                            order.paymentStatus,
                          )}`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {formatDate(order.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => openOrder(order._id)}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-cyan-50 hover:text-cyan-700"
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
              <p className="text-sm text-slate-500">
                {pagination?.total || 0} total orders
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 disabled:opacity-30"
                >
                  <ChevronLeft size={17} />
                </button>

                <span className="px-2 text-sm font-semibold text-slate-600">
                  {pagination?.page || 1} / {pagination?.totalPages || 1}
                </span>

                <button
                  disabled={page >= (pagination?.totalPages || 1)}
                  onClick={() => setPage((value) => value + 1)}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 disabled:opacity-30"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Order detail modal */}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-cyan-600">
                  Order details
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-900">
                  {selectedOrder.orderNumber}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {detailLoading ? (
              <div className="p-10 text-center">Loading...</div>
            ) : (
              <div className="space-y-6 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500">
                      Customer
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {selectedOrder.customerName}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      {selectedOrder.customerPhone}
                    </p>

                    {selectedOrder.customerEmail && (
                      <p className="text-sm text-slate-600">
                        {selectedOrder.customerEmail}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500">
                      Payment
                    </p>

                    <p className="mt-1 font-black text-slate-900">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </p>

                    <span
                      className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusClass(
                        selectedOrder.paymentStatus,
                      )}`}
                    >
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-black text-slate-900">Passes</h3>

                  <div className="mt-3 space-y-3">
                    {selectedOrder.items?.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-2xl border border-slate-100 p-4"
                      >
                        <div>
                          <p className="font-bold text-slate-900">
                            {item.passName}
                          </p>

                          <p className="text-sm text-slate-500">
                            {item.passType} · {item.quantity} ×{" "}
                            {formatCurrency(item.price)}
                          </p>
                        </div>

                        <p className="font-black text-slate-900">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-900 p-5 text-white">
                  <div className="flex justify-between text-sm text-slate-300">
                    <span>Subtotal</span>

                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>

                  <div className="mt-2 flex justify-between text-sm text-slate-300">
                    <span>Convenience fee</span>

                    <span>{formatCurrency(selectedOrder.convenienceFee)}</span>
                  </div>

                  <div className="mt-4 flex justify-between border-t border-white/10 pt-4">
                    <span className="font-bold">Total</span>

                    <span className="text-xl font-black">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
