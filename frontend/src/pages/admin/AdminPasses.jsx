import { useEffect, useMemo, useState } from "react";
import {
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Ticket,
  Trash2,
  Users,
} from "lucide-react";

import PassFormModal from "../../components/admin/PassFormModal.jsx";

import {
  createAdminPass,
  deleteAdminPass,
  getAdminPasses,
  updateAdminPass,
} from "../../services/adminApi.js";

const AdminPasses = () => {
  const [passes, setPasses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPass, setEditingPass] = useState(null);

  const loadPasses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminPasses();

      setPasses(response?.data || []);
    } catch (error) {
      setError(error.message || "Unable to load passes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPasses();
  }, []);

  const filteredPasses = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return passes;
    }

    return passes.filter((pass) => {
      return (
        pass.name?.toLowerCase().includes(query) ||
        pass.passType?.toLowerCase().includes(query) ||
        pass.description?.toLowerCase().includes(query)
      );
    });
  }, [passes, search]);

  const openCreate = () => {
    setEditingPass(null);
    setModalOpen(true);
    setError("");
    setSuccess("");
  };

  const openEdit = (pass) => {
    setEditingPass(pass);
    setModalOpen(true);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (payload) => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingPass) {
        await updateAdminPass(editingPass._id, payload);

        setSuccess("Pass updated successfully.");
      } else {
        /*
         * The backend requires eventId.
         *
         * For this single-event GarbaPass application,
         * replace this value with the actual GarbaEvent _id
         * from your database.
         */
        const eventId = import.meta.env.VITE_GARBA_EVENT_ID;

        if (!eventId) {
          throw new Error("VITE_GARBA_EVENT_ID is not configured.");
        }

        await createAdminPass({
          eventId,
          ...payload,
        });

        setSuccess("Pass created successfully.");
      }

      setModalOpen(false);
      setEditingPass(null);

      await loadPasses();
    } catch (error) {
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (pass) => {
    try {
      setError("");
      setSuccess("");

      await updateAdminPass(pass._id, {
        isActive: !pass.isActive,
      });

      setSuccess(
        `${pass.name} is now ${!pass.isActive ? "active" : "inactive"}.`,
      );

      await loadPasses();
    } catch (error) {
      setError(error.message || "Unable to update pass status.");
    }
  };

  const handleDelete = async (pass) => {
    const confirmed = window.confirm(
      `Delete "${pass.name}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await deleteAdminPass(pass._id);

      setSuccess("Pass deleted successfully.");

      await loadPasses();
    } catch (error) {
      setError(error.message || "Unable to delete pass.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-[2rem] border border-white/80 bg-white/70 p-6 shadow-[0_20px_70px_rgba(15,118,110,0.08)] backdrop-blur-xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700">
              <Ticket size={14} />
              Pass Management
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Event Passes
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create, update and manage your Garba Night ticket inventory.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={loadPasses}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:-translate-y-0.5"
            >
              <Plus size={18} />
              Create Pass
            </button>
          </div>
        </div>
      </section>

      {/* Messages */}
      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-600">
          {success}
        </div>
      )}

      {/* Search */}
      <section className="rounded-[1.75rem] border border-white/80 bg-white/70 p-4 shadow-[0_15px_50px_rgba(15,118,110,0.06)] backdrop-blur-xl">
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search passes by name or type..."
            className="w-full rounded-2xl border border-slate-200 bg-white/80 py-3.5 pl-11 pr-4 text-sm font-medium outline-none placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
          />
        </div>
      </section>

      {/* Pass list */}
      <section>
        {loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-[2rem] border border-white/80 bg-white/70">
            <div className="text-center">
              <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600" />

              <p className="text-sm font-medium text-slate-500">
                Loading passes...
              </p>
            </div>
          </div>
        ) : filteredPasses.length === 0 ? (
          <div className="rounded-[2rem] border border-white/80 bg-white/70 px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-500">
              <Ticket size={25} />
            </div>

            <h2 className="text-lg font-bold text-slate-800">
              No passes found
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {search
                ? "Try a different search."
                : "Create your first event pass."}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {filteredPasses.map((pass) => {
              const total = Number(pass.totalQuantity || 0);

              const sold = Number(pass.soldQuantity || 0);

              const reserved = Number(pass.reservedQuantity || 0);

              const available = Math.max(0, total - sold - reserved);

              const soldPercentage =
                total > 0 ? Math.min(100, (sold / total) * 100) : 0;

              return (
                <article
                  key={pass._id}
                  className="rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-[0_20px_60px_rgba(15,118,110,0.06)] backdrop-blur-xl"
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-cyan-700">
                          {pass.passType}
                        </span>

                        <span
                          className={[
                            "rounded-full px-2.5 py-1 text-[11px] font-bold",
                            pass.isActive
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-500",
                          ].join(" ")}
                        >
                          {pass.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <h2 className="mt-3 text-xl font-black tracking-tight text-slate-900">
                        {pass.name}
                      </h2>

                      <p className="mt-1 text-sm leading-5 text-slate-400">
                        {pass.description || "No description provided."}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(pass)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-cyan-50 hover:text-cyan-700"
                        title="Edit pass"
                      >
                        <Edit3 size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(pass)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        title="Delete pass"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        Price
                      </p>

                      <p className="mt-1 text-2xl font-black text-slate-900">
                        {pass.currency || "INR"}{" "}
                        {Number(pass.price || 0).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-400">
                        Admits
                      </p>

                      <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-700">
                        <Users size={16} />
                        {pass.membersCount}
                      </div>
                    </div>
                  </div>

                  {/* Inventory */}
                  <div className="mt-6 rounded-2xl bg-slate-50/80 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Inventory
                      </p>

                      <p className="text-xs font-bold text-slate-600">
                        {sold} / {total} sold
                      </p>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500"
                        style={{
                          width: `${soldPercentage}%`,
                        }}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-lg font-black text-slate-900">
                          {available}
                        </p>

                        <p className="text-[11px] font-medium text-slate-400">
                          Available
                        </p>
                      </div>

                      <div>
                        <p className="text-lg font-black text-slate-900">
                          {reserved}
                        </p>

                        <p className="text-[11px] font-medium text-slate-400">
                          Reserved
                        </p>
                      </div>

                      <div>
                        <p className="text-lg font-black text-slate-900">
                          {pass.maxPerOrder}
                        </p>

                        <p className="text-[11px] font-medium text-slate-400">
                          Max / Order
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
                    <div>
                      <p className="text-sm font-bold text-slate-700">
                        Sales status
                      </p>

                      <p className="text-xs text-slate-400">
                        {pass.isActive
                          ? "Customers can purchase this pass."
                          : "This pass is hidden from customers."}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(pass)}
                      className={[
                        "relative h-7 w-12 rounded-full transition",
                        pass.isActive ? "bg-cyan-500" : "bg-slate-300",
                      ].join(" ")}
                      aria-label={
                        pass.isActive ? "Deactivate pass" : "Activate pass"
                      }
                    >
                      <span
                        className={[
                          "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition",
                          pass.isActive ? "left-6" : "left-1",
                        ].join(" ")}
                      />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <PassFormModal
        open={modalOpen}
        pass={editingPass}
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setEditingPass(null);
          }
        }}
        onSubmit={handleSubmit}
        loading={saving}
      />
    </div>
  );
};

export default AdminPasses;
