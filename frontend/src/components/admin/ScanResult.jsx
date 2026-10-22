import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
  RotateCcw,
} from "lucide-react";

const resultConfig = {
  SUCCESS: {
    icon: CheckCircle2,
    title: "Entry Allowed",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },

  ALREADY_USED: {
    icon: AlertTriangle,
    title: "Already Used",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },

  CANCELLED: {
    icon: Ban,
    title: "Ticket Cancelled",
    className: "border-red-200 bg-red-50 text-red-700",
  },

  REFUNDED: {
    icon: RotateCcw,
    title: "Ticket Refunded",
    className: "border-red-200 bg-red-50 text-red-700",
  },

  INVALID: {
    icon: XCircle,
    title: "Invalid Ticket",
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

export default function ScanResult({ result, onReset }) {
  if (!result) return null;

  const config = resultConfig[result.result] || resultConfig.INVALID;

  const Icon = config.icon;
  const ticket = result.data?.ticket;

  return (
    <div className={`mt-6 rounded-3xl border p-6 ${config.className}`}>
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-white/70 p-3">
          <Icon size={32} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold">{config.title}</h3>

          <p className="mt-1 text-sm">{result.message}</p>

          {ticket && (
            <div className="mt-5 rounded-2xl bg-white/70 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide opacity-60">
                    Ticket
                  </p>

                  <p className="mt-1 font-semibold">{ticket.ticketNumber}</p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide opacity-60">
                    Pass
                  </p>

                  <p className="mt-1 font-semibold">{ticket.passName}</p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide opacity-60">
                    Holder
                  </p>

                  <p className="mt-1 font-semibold">{ticket.holderName}</p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide opacity-60">
                    Members
                  </p>

                  <p className="mt-1 font-semibold">{ticket.membersCount}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="mt-5 w-full rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
      >
        Scan Next Ticket
      </button>
    </div>
  );
}
