import { motion } from "motion/react";
import { Ticket, MapPin } from "lucide-react";

function Navbar({ event }) {
  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed left-0 right-0 top-0 z-50 px-4 pt-4"
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-white/60 bg-white/55 px-4 py-3 shadow-[0_8px_40px_rgba(20,184,166,0.12)] backdrop-blur-2xl md:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 shadow-sm">
            <Ticket className="h-5 w-5 text-teal-600" />
          </div>

          <div>
            <p className="text-sm font-black tracking-tight text-slate-900">
              GarbaPass
            </p>

            <p className="text-[10px] font-medium text-slate-500">
              Celebrate. Dance. Repeat.
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <a href="#passes" className="transition hover:text-teal-600">
            Passes
          </a>

          <a href="#event" className="transition hover:text-teal-600">
            Event
          </a>
        </div>

        <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
          <MapPin className="h-4 w-4 text-teal-500" />
          <span>{event?.venue?.name || "Jabalpur"}</span>
        </div>
      </nav>
    </motion.header>
  );
}

export default Navbar;
