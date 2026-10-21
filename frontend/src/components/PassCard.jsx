import { motion } from "motion/react";
import { ArrowRight, Check, Users } from "lucide-react";

function PassCard({ pass, onSelect, index = 0 }) {
  const available =
    pass.totalQuantity - pass.soldQuantity - (pass.reservedQuantity || 0);

  const lowStock = available > 0 && available <= 10;

  const soldOut = available <= 0;

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 30,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.2,
      }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
      }}
      whileHover={{
        y: -6,
      }}
      className="group relative"
    >
      <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-cyan-200/30 to-teal-200/20 opacity-0 blur-xl transition duration-500 group-hover:opacity-100" />

      <div className="relative h-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/55 p-6 shadow-[0_15px_50px_rgba(15,118,110,0.08)] backdrop-blur-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-600">
              {pass.passType}
            </p>

            {lowStock && (
              <p className="mt-3 text-xs font-semibold text-orange-600">
                Only {available} left
              </p>
            )}

            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
              {pass.name}
            </h3>
          </div>

          <div className="rounded-xl bg-white/70 px-3 py-2 text-xs font-bold text-slate-500 shadow-sm">
            {pass.membersCount} {pass.membersCount === 1 ? "Person" : "People"}
          </div>
        </div>

        <p className="mt-4 min-h-[48px] text-sm leading-6 text-slate-500">
          {pass.description || "Entry pass for Garba Night."}
        </p>

        <div className="my-6 h-px bg-slate-200/70" />

        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Starting from</p>

            <p className="mt-1 text-4xl font-black tracking-tight text-slate-950">
              ₹{pass.price}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Users className="h-4 w-4 text-teal-500" />
            {pass.membersCount} entry
            {pass.membersCount !== 1 ? "ies" : ""}
          </div>
        </div>

        <ul className="mt-6 space-y-2.5">
          <li className="flex items-center gap-2 text-sm text-slate-600">
            <Check className="h-4 w-4 text-teal-500" />
            Digital QR ticket
          </li>

          <li className="flex items-center gap-2 text-sm text-slate-600">
            <Check className="h-4 w-4 text-teal-500" />
            Instant confirmation
          </li>

          <li className="flex items-center gap-2 text-sm text-slate-600">
            <Check className="h-4 w-4 text-teal-500" />
            Secure entry
          </li>
        </ul>

        <motion.button
          whileTap={{
            scale: 0.97,
          }}
          disabled={soldOut}
          onClick={() => onSelect(pass)}
          className={`mt-7 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold transition ${
            soldOut
              ? "cursor-not-allowed bg-slate-200 text-slate-400"
              : "bg-slate-950 text-white shadow-lg hover:bg-teal-700"
          }`}
        >
          {soldOut ? "Sold out" : "Get this pass"}

          {!soldOut && <ArrowRight className="h-4 w-4" />}
        </motion.button>
      </div>
    </motion.article>
  );
}

export default PassCard;
