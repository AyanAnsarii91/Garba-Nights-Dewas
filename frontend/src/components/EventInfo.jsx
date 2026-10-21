import {
  CalendarDays,
  Clock3,
  MapPin,
  ShieldCheck,
} from "lucide-react";

function EventInfo({ event }) {
  const formattedDate = event?.eventDate
    ? new Date(event.eventDate).toLocaleDateString(
        "en-IN",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      )
    : "";

  return (
    <section
      id="event"
      className="px-5 py-20 sm:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/45 p-6 shadow-[0_20px_80px_rgba(15,118,110,0.08)] backdrop-blur-2xl sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">
                Event details
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
                {event?.name}
              </h2>

              <p className="mt-4 max-w-xl leading-7 text-slate-500">
                {event?.description ||
                  "Come dressed to dance and ready for a night to remember."}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <InfoItem
                  icon={CalendarDays}
                  title="Date"
                  value={formattedDate}
                />

                <InfoItem
                  icon={Clock3}
                  title="Time"
                  value={`${event?.startTime} - ${event?.endTime}`}
                />

                <InfoItem
                  icon={MapPin}
                  title="Venue"
                  value={event?.venue?.name}
                />

                <InfoItem
                  icon={ShieldCheck}
                  title="Entry"
                  value="Secure QR verification"
                />
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/50 p-7 backdrop-blur-xl">
              <p className="text-sm font-semibold text-slate-400">
                Location
              </p>

              <div className="mt-5 flex h-44 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-100/70 to-teal-100/70">
                <MapPin className="h-10 w-10 text-teal-600" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                {event?.venue?.name}
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                {event?.venue?.address}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoItem({
  icon: Icon,
  title,
  value,
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/45 p-4 backdrop-blur-xl">
      <Icon className="h-5 w-5 text-teal-600" />

      <p className="mt-3 text-xs font-medium text-slate-400">
        {title}
      </p>

      <p className="mt-1 text-sm font-semibold leading-5 text-slate-700">
        {value}
      </p>
    </div>
  );
}

export default EventInfo;