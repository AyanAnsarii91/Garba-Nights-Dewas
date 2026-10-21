import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
  Ticket as TicketIcon,
  Users,
} from "lucide-react";
import { motion } from "motion/react";

import { getTicketByNumber, getTicketsByOrder } from "../services/api.js";

function Ticket() {
  const { orderId, ticketNumber } = useParams();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadTickets = async () => {
      try {
        setLoading(true);
        setError("");

        if (orderId) {
          const response = await getTicketsByOrder(orderId);
          if (!active) return;
          setTickets(response.data.tickets);
          setOrder(response.data.order);
        } else if (ticketNumber) {
          const response = await getTicketByNumber(ticketNumber);
          if (!active) return;
          setTickets([response.data.ticket]);
          setOrder(response.data.ticket.order);
        } else {
          throw new Error("No ticket or order was specified.");
        }
      } catch (loadError) {
        if (!active) return;
        console.error("Ticket loading error:", loadError);
        setError(loadError.message || "Unable to load your tickets.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTickets();

    return () => {
      active = false;
    };
  }, [orderId, ticketNumber]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#ecfffd] p-6">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" />
          <p className="mt-5 text-sm font-semibold text-slate-500">
            Loading your tickets...
          </p>
        </div>
      </main>
    );
  }

  if (error || tickets.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#ecfffd] p-6">
        <div className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/65 p-8 text-center shadow-xl backdrop-blur-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <TicketIcon className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="mt-5 text-2xl font-black text-slate-900">
            Tickets unavailable
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error || "No valid tickets were found for this order."}
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-700"
          >
            Back to event
          </button>
        </div>
      </main>
    );
  }

  const totalMembers = tickets.reduce(
    (total, ticket) => total + ticket.membersCount,
    0,
  );
  const event = tickets[0].event;

  return (
    <main className="min-h-screen overflow-hidden bg-[#ecfffd] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-180px] top-[-150px] h-[450px] w-[450px] rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute right-[-150px] top-[20%] h-[450px] w-[450px] rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute bottom-[-200px] left-[25%] h-[500px] w-[500px] rounded-full bg-teal-200/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-black tracking-tight text-slate-950">
              GarbaPass
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Your digital event {tickets.length === 1 ? "pass" : "passes"}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/55 px-4 py-2 text-xs font-bold text-teal-700 shadow-sm backdrop-blur-xl">
            <ShieldCheck className="h-4 w-4" />
            Payment confirmed
          </div>
        </div>

        {order && (
          <div className="mb-6 rounded-2xl border border-white/70 bg-white/60 p-5 shadow-sm backdrop-blur-xl sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                Order {order.orderNumber}
              </p>
              <p className="mt-1 text-sm font-bold text-slate-700">
                {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}{" "}
                · {totalMembers} admitted{" "}
                {totalMembers === 1 ? "person" : "people"}
              </p>
            </div>
            <p className="mt-3 text-lg font-black text-teal-700 sm:mt-0">
              ₹{order.totalAmount}
            </p>
          </div>
        )}

        <div className="space-y-8">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.ticketNumber} ticket={ticket} event={event} />
          ))}
        </div>

        <div className="mx-auto mt-6 flex max-w-xl items-center justify-center gap-2 text-center text-xs leading-5 text-slate-400">
          <ShieldCheck className="h-4 w-4 shrink-0 text-teal-500" />
          Each QR code is securely linked to its ticket. Keep it ready at the
          event entrance.
        </div>
      </div>
    </main>
  );
}

function TicketCard({ ticket, event }) {
  const eventDate = event?.eventDate ? new Date(event.eventDate) : null;
  const formattedDate =
    eventDate && !Number.isNaN(eventDate.getTime())
      ? eventDate.toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "Date to be announced";
  const status = getTicketStatus(ticket.status);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/65 shadow-[0_30px_100px_rgba(15,118,110,0.12)] backdrop-blur-2xl"
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-400 via-cyan-300 to-sky-200 px-6 py-8 text-white sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute right-[-70px] top-[-100px] h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                You're going
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                {event?.name || "Garba Night"}
              </h1>
            </div>
            <div className="hidden rounded-2xl bg-white/20 p-3 backdrop-blur-md sm:block">
              <TicketIcon className="h-7 w-7" />
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <EventChip icon={CalendarDays} text={formattedDate} />
            <EventChip
              icon={Clock3}
              text={
                event?.startTime || event?.endTime
                  ? `${event.startTime || "Time TBA"} – ${event.endTime || "Time TBA"}`
                  : "Time to be announced"
              }
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px]">
        <div className="p-6 sm:p-10">
          <div className="grid gap-5 sm:grid-cols-2">
            <Detail label="Pass" value={ticket.passName} />
            <Detail label="Pass type" value={formatPassType(ticket.passType)} />
            <Detail label="Holder" value={ticket.holderName} />
            <Detail
              label="Admits"
              value={`${ticket.membersCount} ${
                ticket.membersCount === 1 ? "person" : "people"
              }`}
            />
            {ticket.holderPhone && (
              <Detail label="Phone" value={ticket.holderPhone} />
            )}
            {ticket.holderEmail && (
              <Detail label="Email" value={ticket.holderEmail} />
            )}
          </div>

          <div className="my-8 h-px bg-slate-200/70" />

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Venue
            </p>
            <div className="mt-3 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50">
                <MapPin className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {event?.venue?.name || "Venue to be announced"}
                </p>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {event?.venue?.address || "Venue address to be announced"}
                </p>
              </div>
            </div>
          </div>

          <div className="my-8 h-px bg-slate-200/70" />

          <div className="flex items-start gap-3 rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
            <Users className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
            <div>
              <p className="text-sm font-bold text-slate-700">
                One scan admits your entire pass
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                This QR represents this purchased pass. Keep it ready when you
                arrive at the gate.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200/70 bg-white/40 p-6 sm:p-10 lg:border-l lg:border-t-0">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-600">
              Entry QR
            </p>
            <div className="mx-auto mt-5 flex aspect-square max-w-[260px] items-center justify-center rounded-[2rem] border border-slate-100 bg-white p-4 shadow-[0_15px_50px_rgba(15,118,110,0.1)]">
              <img
                src={ticket.qrCode}
                alt={`Entry QR code for ticket ${ticket.ticketNumber}`}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="mt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
                Ticket number
              </p>
              <p className="mt-1 break-all font-mono text-sm font-bold text-slate-700">
                {ticket.ticketNumber}
              </p>
            </div>
            <div className={`mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${status.className}`}>
              <CheckCircle2 className="h-4 w-4" />
              {status.label}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Issued {formatDate(ticket.issuedAt)}
              {ticket.checkedInAt
                ? ` · Checked in ${formatDate(ticket.checkedInAt)}`
                : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-dashed border-slate-300/80 bg-slate-50/50 px-6 py-5 sm:px-10">
        <div className="flex flex-col justify-between gap-3 text-xs text-slate-400 sm:flex-row sm:items-center">
          <p>Issued by GarbaPass</p>
          <p>
            Ticket:{" "}
            <span className="font-mono font-semibold text-slate-500">
              {ticket.ticketNumber}
            </span>
          </p>
        </div>
      </div>
    </motion.section>
  );
}

function EventChip({ icon: Icon, text }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold backdrop-blur-md">
      <Icon className="h-4 w-4" />
      {text}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/50 p-4 backdrop-blur-xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 break-words text-sm font-bold text-slate-800">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "pending";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "pending"
    : date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function getTicketStatus(status) {
  if (status === "USED") {
    return {
      label: "Already checked in",
      className: "bg-slate-100 text-slate-600",
    };
  }

  if (status === "ACTIVE") {
    return {
      label: "Valid for entry",
      className: "bg-emerald-50 text-emerald-700",
    };
  }

  return {
    label: "Not valid for entry",
    className: "bg-red-50 text-red-700",
  };
}

function formatPassType(type) {
  switch (type) {
    case "SINGLE":
      return "Single Pass";
    case "COUPLE":
      return "Couple Pass";
    case "GROUP":
      return "Group Pass";
    default:
      return type || "Event Pass";
  }
}

export default Ticket;
