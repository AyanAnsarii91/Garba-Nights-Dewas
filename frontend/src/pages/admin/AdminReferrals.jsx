import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Link2,
  TrendingUp,
  ShoppingBag,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trophy,
  Star,
} from "lucide-react";
import { adminRequest } from "../../services/adminApi.js";

/* ─── Helpers ─── */
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="ref-stat-card" style={{ "--accent": accent }}>
      <div className="ref-stat-icon">
        <Icon size={18} />
      </div>
      <div>
        <p className="ref-stat-value">{value ?? "—"}</p>
        <p className="ref-stat-label">{label}</p>
      </div>
    </div>
  );
}

export default function AdminReferrals() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("recent");

  const load = useCallback(
    async (p = page) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          page: p,
          limit: 20,
          sort,
          ...(search.trim() ? { search: search.trim() } : {}),
        });
        const res = await adminRequest(`/admin/referrals?${params}`);
        setData(res.data);
      } catch (err) {
        setError(err.message || "Failed to load referral data");
      } finally {
        setLoading(false);
      }
    },
    [page, sort, search],
  );

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load(1);
  };

  const stats = data?.stats;
  const referrals = data?.referrals ?? [];
  const pagination = data?.pagination;
  const topPerformers = data?.topPerformers ?? [];

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Referral Performance</h1>
          <p className="admin-page-subtitle">
            Squad invite codes and booking attribution for Dholki Nights 2026
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(page)}
          className="admin-icon-button"
          aria-label="Refresh"
        >
          <RefreshCw size={17} className={loading ? "spin" : ""} />
        </button>
      </div>

      {/* Summary stats */}
      {stats && (
        <div className="ref-stats-grid">
          <StatCard
            icon={Users}
            label="Active Codes"
            value={stats.totalCodes}
            accent="#7c3aed"
          />
          <StatCard
            icon={Eye}
            label="Total Visits"
            value={stats.totalVisits}
            accent="#0891b2"
          />
          <StatCard
            icon={ShoppingBag}
            label="Total Orders"
            value={stats.totalOrders}
            accent="#d97706"
          />
          <StatCard
            icon={TrendingUp}
            label="Successful Bookings"
            value={stats.totalSuccessfulBookings}
            accent="#16a34a"
          />
        </div>
      )}

      {/* Top performers */}
      {topPerformers.length > 0 && (
        <div className="ref-top-block">
          <div className="ref-top-header">
            <Trophy size={16} />
            <h2>Top Squad Inviters</h2>
          </div>
          <div className="ref-top-list">
            {topPerformers.map((t, i) => (
              <div key={t._id} className="ref-top-item">
                <span className="ref-top-rank">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <Star size={13} />}
                </span>
                <div className="ref-top-info">
                  <strong>{t.code}</strong>
                  <span>{t.customerName || "—"}</span>
                </div>
                <div className="ref-top-meta">
                  <span>{t.successfulOrders} bookings</span>
                  <span>{t.totalVisits} visits</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="ref-filters">
        <form onSubmit={handleSearch} className="ref-search-form">
          <div className="ref-search-wrap">
            <Search size={15} className="ref-search-icon" />
            <input
              type="search"
              placeholder="Search by code, name, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ref-search-input"
            />
          </div>
          <button type="submit" className="admin-btn-primary">
            Search
          </button>
        </form>

        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="ref-sort-select"
        >
          <option value="recent">Newest first</option>
          <option value="visits">Most visits</option>
          <option value="bookings">Most bookings</option>
          <option value="orders">Most orders</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="admin-error-banner">
          {error}
          <button onClick={() => load(page)} className="admin-link-btn">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {loading && !data ? (
        <div className="admin-loading-state">
          <div className="admin-spinner" />
          <p>Loading referral data…</p>
        </div>
      ) : (
        <>
          <div className="ref-table-wrap">
            <table className="ref-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Visits</th>
                  <th>Orders</th>
                  <th>Bookings</th>
                  <th>Conv. %</th>
                  <th>Status</th>
                  <th>Last Used</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {referrals.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="ref-table-empty">
                      <Users size={32} className="ref-empty-icon" />
                      <p>No referral codes found.</p>
                    </td>
                  </tr>
                ) : (
                  referrals.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <div className="ref-code-cell">
                          <Link2 size={13} />
                          <strong>{r.code}</strong>
                        </div>
                      </td>
                      <td>{r.customerName || <span className="ref-muted">—</span>}</td>
                      <td>{r.customerPhone || <span className="ref-muted">—</span>}</td>
                      <td>
                        <span className="ref-badge ref-badge-visits">{r.totalVisits}</span>
                      </td>
                      <td>{r.totalOrders}</td>
                      <td>
                        <span
                          className={`ref-badge ${r.successfulOrders > 0 ? "ref-badge-success" : "ref-badge-zero"}`}
                        >
                          {r.successfulOrders}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`ref-conv ${Number(r.conversionRate) > 0 ? "ref-conv-positive" : ""}`}
                        >
                          {r.conversionRate}%
                        </span>
                      </td>
                      <td>
                        <span className={`ref-status-pill ${r.isActive ? "is-active" : "is-inactive"}`}>
                          {r.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="ref-date">{fmtDate(r.lastUsedAt)}</td>
                      <td className="ref-date">{fmtDate(r.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="ref-pagination">
              <span className="ref-pag-info">
                Page {pagination.page} of {pagination.pages} &nbsp;·&nbsp;{" "}
                {pagination.total} total
              </span>
              <div className="ref-pag-controls">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="ref-pag-btn"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                  className="ref-pag-btn"
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
