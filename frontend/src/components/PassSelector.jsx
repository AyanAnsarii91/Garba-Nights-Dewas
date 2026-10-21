import { motion } from "motion/react";

import PassCard from "./PassCard.jsx";

function PassSelector({
  passes,
  onSelect,
}) {
  return (
    <section
      id="passes"
      className="relative px-5 py-24 sm:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          className="max-w-2xl"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">
            Choose your experience
          </p>

          <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Pick your pass.
            <br />
            Bring your people.
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-500">
            Simple pricing, digital tickets and
            QR-based entry. No paper. No nonsense.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {passes.map((pass, index) => (
            <PassCard
              key={pass._id}
              pass={pass}
              index={index}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default PassSelector;