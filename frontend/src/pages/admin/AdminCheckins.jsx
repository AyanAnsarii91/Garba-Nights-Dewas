import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import {
  getAdminCheckins,
} from "../../services/adminApi";

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

const resultClass = (result) => {
  if (result === "SUCCESS") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (result === "ALREADY_USED") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  return "bg-red-50 text-red-700 ring-red-200";
};

export default function AdminCheckins() {
  const [checkins, setCheckins] = useState([]);
  const [pagination, setPagination] =
    useState(null);

  const [result, setResult] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCheckins = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getAdminCheckins({
          result,
          search,
          page,
          limit: 30,
        });

      setCheckins(
        response?.data?.checkins || []
      );

      setPagination(
        response?.data?.pagination || null
      );
    } catch (error) {
      console.error(
        "Check-ins loading error:",
        error
      );

      setError(
        error.message ||
          "Unable to load check-ins"
      );
    } finally {
      setLoading(false);
    }
  }, [result, search, page]);

  useEffect(() => {
    loadCheckins();
  }, [loadCheckins]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-600">
          Gate activity
        </p>

        <h1 className="mt-1 text-3xl font-black text-slate-900">
          Check-ins
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Complete history of QR scan attempts.
        </p>
      </div>

      <div className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-[0_15px_50px_rgba(15,118,110,0.07)]">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search ticket number or scanner..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-50"
            />
          </div>

          <select
            value={result}
            onChange={(event) => {
              setResult(event.target.value);
              setPage(1);
            }}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-cyan-400"
          >
            <option value="">
              All results
            </option>

            <option value="SUCCESS">
              Success
            </option>

            <option value="ALREADY_USED">
              Already used
            </option>

            <option value="INVALID">
              Invalid
            </option>

            <option value="CANCELLED">
              Cancelled
            </option>

            <option value="REFUNDED">
              Refunded
            </option>
          </select>

          <button
            type="button"
            onClick={loadCheckins}
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
            <RefreshCw
              size={22}
              className="animate-spin text-cyan-600"
            />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600">
            {error}
          </div>
        ) : checkins.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
            <ShieldCheck
              size={40}
              className="text-slate-300"
            />

            <p className="mt-3 font-bold text-slate-700">
              No check-ins found
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4">
                      Ticket
                    </th>

                    <th className="px-5 py-4">
                      Holder
                    </th>

                    <th className="px-5 py-4">
                      Pass
                    </th>

                    <th className="px-5 py-4">
                      Result
                    </th>

                    <th className="px-5 py-4">
                      Scanner
                    </th>

                    <th className="px-5 py-4">
                      Time
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {checkins.map(
                    (checkin) => (
                      <tr
                        key={checkin._id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900">
                            {checkin.ticketNumber}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">
                            {checkin.ticket
                              ?.holderName ||
                              "—"}
                          </p>

                          <p className="text-xs text-slate-500">
                            {checkin.ticket
                              ?.holderPhone ||
                              ""}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-700">
                            {checkin.ticket
                              ?.passName ||
                              "—"}
                          </p>

                          {checkin.ticket
                            ?.membersCount && (
                            <p className="text-xs text-slate-500">
                              {
                                checkin.ticket
                                  .membersCount
                              }{" "}
                              members
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${resultClass(
                              checkin.result
                            )}`}
                          >
                            {checkin.result}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {checkin.scannerName ||
                            "Admin"}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {formatDate(
                            checkin.scannedAt
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
              <p className="text-sm text-slate-500">
                {pagination?.total || 0} scan records
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((value) =>
                      Math.max(1, value - 1)
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white p-2 disabled:opacity-30"
                >
                  <ChevronLeft size={17} />
                </button>

                <span className="px-2 text-sm font-semibold text-slate-600">
                  {pagination?.page || 1} /{" "}
                  {pagination?.totalPages || 1}
                </span>

                <button
                  disabled={
                    page >=
                    (pagination?.totalPages || 1)
                  }
                  onClick={() =>
                    setPage((value) =>
                      value + 1
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white p-2 disabled:opacity-30"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}