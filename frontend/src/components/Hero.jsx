import { motion } from "motion/react";
import { ArrowDown, CalendarDays, MapPin, Sparkles } from "lucide-react";

function Hero({ event }) {
  const scrollToPasses = () => {
    document.getElementById("passes")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const formattedDate = event?.eventDate
    ? new Date(event.eventDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <section className="relative flex min-h-[760px] items-center overflow-hidden px-5 pb-20 pt-36 sm:px-8">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-20 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />

        <div className="absolute right-[-100px] top-40 h-80 w-80 rounded-full bg-teal-200/40 blur-3xl" />

        <div className="absolute bottom-[-120px] left-1/3 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.7,
          }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/55 px-4 py-2 text-xs font-semibold text-teal-700 shadow-sm backdrop-blur-xl">
            <Sparkles className="h-4 w-4" />

            <span>Jabalpur's Garba Night</span>
          </div>

          <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-8xl">
            {event?.name || "Garba Night"}
          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            {event?.description ||
              "One night. Great music. Endless garba. Get your pass and come celebrate."}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/50 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-xl">
              <CalendarDays className="h-4 w-4 text-teal-600" />
              {formattedDate}
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/50 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-xl">
              <MapPin className="h-4 w-4 text-teal-600" />
              {event?.venue?.name}
            </div>
          </div>

          <motion.button
            whileHover={{
              scale: 1.03,
            }}
            whileTap={{
              scale: 0.97,
            }}
            onClick={scrollToPasses}
            className="group mt-9 inline-flex items-center gap-3 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-bold text-white shadow-[0_15px_40px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
          >
            Get your pass
            <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-1" />
          </motion.button>
        </motion.div>

        {/* Glass event card */}
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.92,
            y: 20,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          transition={{
            duration: 0.8,
            delay: 0.15,
          }}
          className="relative mx-auto w-full max-w-md"
        >
          <div className="absolute -inset-4 rounded-[3rem] bg-cyan-300/20 blur-3xl" />

          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/45 p-3 shadow-[0_30px_100px_rgba(13,148,136,0.15)] backdrop-blur-2xl">
            <div className="relative min-h-[440px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-teal-400 via-cyan-300 to-sky-200 p-7">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/20" />

              <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full border-[35px] border-white/10" />

              <div className="relative flex h-full min-h-[390px] flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                    25 OCT 2026
                  </span>

                  <Sparkles className="h-6 w-6 text-white" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white/80">
                    GARBA NIGHT
                  </p>

                  <h2 className="mt-2 text-5xl font-black tracking-tight text-white">
                    Let's
                    <br />
                    Dance.
                  </h2>

                  <div className="mt-8 rounded-2xl border border-white/30 bg-white/15 p-4 backdrop-blur-md">
                    <p className="text-xs uppercase tracking-widest text-white/70">
                      Venue
                    </p>

                    <p className="mt-1 font-semibold text-white">
                      {event?.venue?.name}
                    </p>

                    <p className="mt-1 text-sm text-white/75">
                      {event?.venue?.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-white/80">
                  <span>{event?.startTime}</span>

                  <span>GarbaPass</span>

                  <span>{event?.endTime}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
