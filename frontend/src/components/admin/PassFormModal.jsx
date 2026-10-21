import { useEffect, useState } from "react";
import { X, Save, Ticket } from "lucide-react";

const initialForm = {
  passType: "SINGLE",
  name: "",
  description: "",
  price: "",
  currency: "INR",
  membersCount: "1",
  totalQuantity: "",
  maxPerOrder: "5",
  sortOrder: "0",
};

const PassFormModal = ({ open, pass, onClose, onSubmit, loading = false }) => {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  const isEditing = Boolean(pass);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (pass) {
      setForm({
        passType: pass.passType || "SINGLE",
        name: pass.name || "",
        description: pass.description || "",
        price: pass.price ?? "",
        currency: pass.currency || "INR",
        membersCount: pass.membersCount ?? "1",
        totalQuantity: pass.totalQuantity ?? "",
        maxPerOrder: pass.maxPerOrder ?? "5",
        sortOrder: pass.sortOrder ?? "0",
      });
    } else {
      setForm(initialForm);
    }

    setError("");
  }, [open, pass]);

  if (!open) {
    return null;
  }

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.name.trim()) {
      setError("Pass name is required.");
      return;
    }

    if (Number(form.price) < 0 || form.price === "") {
      setError("Please enter a valid price.");
      return;
    }

    if (!isEditing && (!form.totalQuantity || Number(form.totalQuantity) < 1)) {
      setError("Total quantity must be at least 1.");
      return;
    }

    if (!form.membersCount || Number(form.membersCount) < 1) {
      setError("Members count must be at least 1.");
      return;
    }

    if (!form.maxPerOrder || Number(form.maxPerOrder) < 1) {
      setError("Maximum per order must be at least 1.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      currency: form.currency.trim().toUpperCase(),
      membersCount: Number(form.membersCount),
      maxPerOrder: Number(form.maxPerOrder),
      sortOrder: Number(form.sortOrder || 0),
    };

    if (!isEditing) {
      payload.passType = form.passType;
      payload.totalQuantity = Number(form.totalQuantity);
    } else if (form.totalQuantity !== "") {
      payload.totalQuantity = Number(form.totalQuantity);
    }

    try {
      await onSubmit(payload);
    } catch (error) {
      setError(error.message || "Unable to save pass.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
              <Ticket size={21} />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900">
                {isEditing ? "Edit Pass" : "Create Pass"}
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                {isEditing
                  ? "Update the pass configuration."
                  : "Add a new pass type to the event."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Pass type */}
          {!isEditing && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Pass type
              </label>

              <div className="grid grid-cols-3 gap-2">
                {["SINGLE", "COUPLE", "GROUP"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateField("passType", type)}
                    className={[
                      "rounded-2xl border px-3 py-3 text-xs font-bold transition",
                      form.passType === type
                        ? "border-cyan-400 bg-cyan-50 text-cyan-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-cyan-200",
                    ].join(" ")}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Pass name
            </label>

            <input
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="e.g. Single Entry Pass"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Description
            </label>

            <textarea
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              rows={3}
              placeholder="Short description for this pass"
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          {/* Price / currency */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Price
              </label>

              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(event) => updateField("price", event.target.value)}
                placeholder="499"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Currency
              </label>

              <input
                value={form.currency}
                onChange={(event) =>
                  updateField("currency", event.target.value)
                }
                placeholder="INR"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium uppercase outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </div>
          </div>

          {/* Members / quantity */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Members
              </label>

              <input
                type="number"
                min="1"
                value={form.membersCount}
                onChange={(event) =>
                  updateField("membersCount", event.target.value)
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Total quantity
              </label>

              <input
                type="number"
                min="1"
                value={form.totalQuantity}
                onChange={(event) =>
                  updateField("totalQuantity", event.target.value)
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Max / order
              </label>

              <input
                type="number"
                min="1"
                value={form.maxPerOrder}
                onChange={(event) =>
                  updateField("maxPerOrder", event.target.value)
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Sort order
            </label>

            <input
              type="number"
              value={form.sortOrder}
              onChange={(event) => updateField("sortOrder", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />
                  {isEditing ? "Save Changes" : "Create Pass"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PassFormModal;
