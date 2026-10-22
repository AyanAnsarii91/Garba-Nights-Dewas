import { useMemo, useState } from "react";
import { motion } from "motion/react";

import PassCard from "./PassCard.jsx";

function PassSelector({ passes, onSelect }) {
  const [activeType, setActiveType] = useState("ALL");
  const passTypes = useMemo(() => [...new Set(passes.map((pass) => pass.passType).filter(Boolean))], [passes]);
  const visiblePasses = activeType === "ALL" ? passes : passes.filter((pass) => pass.passType === activeType);

  return (
    <section id="passes" className="section-wrap">
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
          className="section-heading"
        >
          <div><p className="section-kicker">Choose your experience</p><h2 className="section-title">Make the night yours.</h2></div>
          <p className="section-copy">Pick the pass that fits your crew. Every option includes a digital ticket and secure QR entry.</p>
        </motion.div>
        {passes.length > 0 && <div className="pass-tabs" role="group" aria-label="Filter passes by type">
          <button type="button" className={`pass-tab ${activeType === "ALL" ? "is-active" : ""}`} aria-pressed={activeType === "ALL"} onClick={() => setActiveType("ALL")}>All passes</button>
          {passTypes.map((type) => <button key={type} type="button" className={`pass-tab ${activeType === type ? "is-active" : ""}`} aria-pressed={activeType === type} onClick={() => setActiveType(type)}>{type.charAt(0) + type.slice(1).toLowerCase()}</button>)}
        </div>}

        {visiblePasses.length > 0 ? <div className="pass-grid">
          {visiblePasses.map((pass, index) => (
            <PassCard
              key={pass._id}
              pass={pass}
              index={index}
              onSelect={onSelect}
            />
          ))}
        </div> : <div className="empty-passes">Passes will appear here when they become available.</div>}
    </section>
  );
}

export default PassSelector;