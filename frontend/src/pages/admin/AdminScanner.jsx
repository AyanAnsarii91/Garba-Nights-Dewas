import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Keyboard,
  Loader2,
  RotateCcw,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import { scanAdminTicket } from "../../services/adminApi";

const RESULT_CONFIG = {
  SUCCESS: {
    title: "ENTRY APPROVED",
    description: "Ticket is valid. Entry has been recorded.",
  },

  ALREADY_USED: {
    title: "ALREADY USED",
    description: "This ticket has already been checked in.",
  },

  INVALID: {
    title: "INVALID TICKET",
    description: "This QR code is not valid for this event.",
  },

  CANCELLED: {
    title: "TICKET CANCELLED",
    description: "This ticket cannot be used for entry.",
  },

  REFUNDED: {
    title: "TICKET REFUNDED",
    description: "This ticket cannot be used for entry.",
  },
};

export default function AdminScanner() {
  const [mode, setMode] = useState("manual");

  const [token, setToken] = useState("");

  const [scanning, setScanning] = useState(false);

  const [result, setResult] = useState(null);

  const [error, setError] = useState("");

  const inputRef = useRef(null);

  useEffect(() => {
    if (mode === "manual") {
      inputRef.current?.focus();
    }
  }, [mode]);

  const handleScan = async (value) => {
    const cleanValue = value?.trim();

    if (!cleanValue || scanning) {
      return;
    }

    try {
      setScanning(true);
      setError("");
      setResult(null);

      const response = await scanAdminTicket(cleanValue);

      setResult({
        result: response?.result || "SUCCESS",

        message: response?.message || "Entry approved",

        data: response?.data || null,
      });

      setToken("");
    } catch (error) {
      setResult({
        result: error?.result || "INVALID",
        message: error.message || "Unable to scan ticket",
        data: null,
      });
    } finally {
      setScanning(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    handleScan(token);
  };

  const resetScanner = () => {
    setResult(null);
    setError("");
    setToken("");

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const resultType = result?.result || null;

  const resultConfig = resultType
    ? RESULT_CONFIG[resultType] || RESULT_CONFIG.INVALID
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-600">
          Gate control
        </p>

        <h1 className="mt-1 text-3xl font-black text-slate-900">
          Ticket Scanner
        </h1>

        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
          Scan a GarbaPass QR code to validate entry and mark the ticket as
          used.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="inline-flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              mode === "manual"
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Keyboard size={16} />
            Scanner Input
          </button>

          <button
            type="button"
            onClick={() => setMode("camera")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              mode === "camera"
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Camera size={16} />
            Camera
          </button>
        </div>
      </div>

      {!result ? (
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,118,110,0.1)] backdrop-blur-xl sm:p-10">
          {mode === "camera" ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-cyan-200 bg-cyan-50/50 text-center">
              <Camera size={48} className="text-cyan-500" />

              <h2 className="mt-4 text-lg font-black text-slate-900">
                Camera scanner
              </h2>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                Camera QR scanning will be connected here. The backend
                validation endpoint is already ready.
              </p>

              <button
                type="button"
                onClick={() => setMode("manual")}
                className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
              >
                Use scanner input
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl bg-slate-950 px-6 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 text-cyan-300">
                  <Camera size={38} />
                </div>

                <p className="mt-5 text-sm font-semibold text-white">
                  Scan QR code
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  USB/Bluetooth scanner input can automatically type the token
                  here.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  QR token
                </label>

                <input
                  ref={inputRef}
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  autoComplete="off"
                  placeholder="Scan or enter QR token..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center font-mono text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-50"
                />
              </div>

              <button
                type="submit"
                disabled={scanning || !token.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-bold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {scanning ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <ShieldAlert size={18} />
                    Validate Entry
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      ) : (
        <div
          className={`rounded-[2rem] border p-8 text-center shadow-[0_20px_70px_rgba(15,118,110,0.1)] sm:p-12 ${
            resultType === "SUCCESS"
              ? "border-emerald-200 bg-emerald-50"
              : resultType === "ALREADY_USED"
                ? "border-amber-200 bg-amber-50"
                : "border-red-200 bg-red-50"
          }`}
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
            {resultType === "SUCCESS" ? (
              <CheckCircle2 size={42} className="text-emerald-600" />
            ) : resultType === "ALREADY_USED" ? (
              <ShieldAlert size={42} className="text-amber-600" />
            ) : (
              <XCircle size={42} className="text-red-600" />
            )}
          </div>

          <p
            className={`mt-6 text-sm font-black uppercase tracking-[0.18em] ${
              resultType === "SUCCESS"
                ? "text-emerald-700"
                : resultType === "ALREADY_USED"
                  ? "text-amber-700"
                  : "text-red-700"
            }`}
          >
            {resultConfig?.title}
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-900">
            {resultConfig?.description}
          </h2>

          <p className="mt-3 text-sm text-slate-600">{result.message}</p>

          {result.data?.ticket && (
            <div className="mx-auto mt-7 max-w-md rounded-3xl bg-white p-5 text-left shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Ticket
                </span>

                <span className="font-mono text-sm font-bold text-slate-900">
                  {result.data.ticket.ticketNumber}
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-400">Holder</p>

                  <p className="mt-1 font-bold text-slate-900">
                    {result.data.ticket.holderName}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Pass</p>

                  <p className="mt-1 font-bold text-slate-900">
                    {result.data.ticket.passName}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Members</p>

                  <p className="mt-1 font-bold text-slate-900">
                    {result.data.ticket.membersCount}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Checked in</p>

                  <p className="mt-1 font-bold text-slate-900">
                    {result.data.ticket.checkedInAt
                      ? new Intl.DateTimeFormat("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        }).format(new Date(result.data.ticket.checkedInAt))
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={resetScanner}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-cyan-700"
          >
            <RotateCcw size={17} />
            Scan Next Ticket
          </button>
        </div>
      )}
    </div>
  );
}
