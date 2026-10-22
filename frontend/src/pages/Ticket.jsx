import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Clock3,
  Download,
  ExternalLink,
  IdCard,
  Loader2,
  MapPin,
  ShieldCheck,
  Ticket as TicketIcon,
  Users,
} from "lucide-react";
import { motion } from "motion/react";

import { getTicketByNumber, getTicketsByOrder } from "../services/api.js";
import { downloadTicketImage } from "../utils/downloadTicketImage.js";

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
      <main className="status-state"><div className="status-card"><div className="status-spinner" /><p>Loading your tickets...</p></div></main>
    );
  }

  if (error || tickets.length === 0) {
    return (
      <main className="status-state">
        <div className="status-card">
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
            className="button-primary mt-6"
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
    <main className="ticket-page">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-180px] top-[-150px] h-[450px] w-[450px] rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute right-[-150px] top-[20%] h-[450px] w-[450px] rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute bottom-[-200px] left-[25%] h-[500px] w-[500px] rounded-full bg-teal-200/30 blur-3xl" />
      </div>

      <div className="ticket-shell">
        <div className="ticket-toolbar">
          <div>
              <p className="ticket-brand">
              Dholki Nights
            </p>
              <p className="ticket-caption">
              Your digital event {tickets.length === 1 ? "pass" : "passes"}
            </p>
          </div>
          <div className="ticket-payment-state">
            <ShieldCheck className="h-4 w-4" />
            Payment confirmed
          </div>
        </div>

        {order && (
          <div className="ticket-order-summary">
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

        <div className="ticket-list">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.ticketNumber} ticket={ticket} event={event} />
          ))}
        </div>

        <div className="ticket-note">
          <ShieldCheck className="h-4 w-4 shrink-0 text-teal-500" />
          Each QR code is securely linked to its ticket. Keep it ready at the
          event entrance.
        </div>
        <TicketInstructions />
      </div>
    </main>
  );
}

function TicketCard({ ticket, event }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
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
  const coordinates = event?.venue?.coordinates;
  const mapUrl = coordinates?.latitude != null && coordinates?.longitude != null
    ? `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`
    : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="ticket-card"
    >
      <div className="ticket-banner">
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

      <div className="ticket-body">
        <div className="ticket-content">
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
                  {event?.venue?.name || "BHAGAT SHREE MARRIAGE GARDEN"}
                </p>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {event?.venue?.address || "Raja Ram Nagar, Dewas, Madhya Pradesh 455001"}
                </p>
                <a
                  className="ticket-map-link"
                  href={mapUrl || "https://www.google.com/maps/search/?api=1&query=22.963353,76.027915"}
                  target="_blank"
                  rel="noreferrer"
                >
                  See Location &amp; Directions <ExternalLink size={13} />
                </a>
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

        <div className="ticket-qr-side">
          <div className="ticket-qr-block">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-600">
              Entry QR
            </p>
            <div className="ticket-qr-image">
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

      <div className="ticket-actions">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 text-xs text-slate-400">
            <p>Issued by Dholki Nights</p>
            <p>
              Ticket:{" "}
              <span className="font-mono font-semibold text-slate-500">
                {ticket.ticketNumber}
              </span>
            </p>
            {downloadError && (
              <p role="alert" className="font-semibold text-red-600">
                {downloadError}
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={downloading || !ticket.qrCode}
            onClick={async () => {
              setDownloading(true);
              setDownloadError("");

              try {
                await downloadTicketImage(ticket, event);
              } catch (error) {
                console.error("Ticket download error:", error);
                setDownloadError(
                  error.message || "Unable to download this ticket.",
                );
              } finally {
                setDownloading(false);
              }
            }}
            className="button-primary ticket-download"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {downloading ? "Preparing ticket..." : "Download Ticket"}
          </button>
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

function TicketInstructions() {
  return (
    <section className="ticket-instructions" aria-labelledby="ticket-instructions-title">
      <div className="ticket-instructions-heading">
        <ShieldCheck size={22} className="ticket-instructions-icon" />
        <div>
          <span className="ticket-instructions-kicker">Important Instructions</span>
          <h2 id="ticket-instructions-title" className="ticket-instructions-title">
            GARBA NIGHT – TERMS &amp; CONDITIONS
          </h2>
        </div>
      </div>

      <div className="ticket-key-rules">
        <div className="ticket-key-rule">
          <div className="ticket-rule-icon">
            <IdCard size={18} />
          </div>
          <div>
            <strong>1. Keep your any type of government ID proof</strong>
            <p>Carry any valid government-issued photo ID proof (Aadhaar / Voter ID / Driving License / PAN) for mandatory security check at the gate.</p>
          </div>
        </div>
        <div className="ticket-key-rule alert">
          <div className="ticket-rule-icon alert">
            <Clock size={18} />
          </div>
          <div>
            <strong>2. After 8:30 there will be no entry for customers</strong>
            <p>Gates close strictly at 8:30 PM. No admission will be permitted after 8:30 PM under any circumstances.</p>
          </div>
        </div>
      </div>

      <ul className="ticket-terms-list">
        <li>Entry by valid ticket/pass only.</li>
        <li>Security checking is mandatory.</li>
        <li>No alcohol, drugs, weapons or dangerous items.</li>
        <li>Misbehaviour, harassment and fighting are strictly prohibited.</li>
        <li>Follow all event rules and security instructions.</li>
        <li>Photography/videography as per event policy.</li>
        <li>The organiser reserves the right to deny entry for valid safety or rule-related reasons, subject to applicable law.</li>
      </ul>

      <div className="ticket-thanks-box">
        <p className="ticket-thanks">
          <strong>Thank you for your cooperation. Enjoy Garba Night! 💃🪘</strong>
        </p>
      </div>
    </section>
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
