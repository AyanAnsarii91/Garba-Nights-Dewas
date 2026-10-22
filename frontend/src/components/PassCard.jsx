import { motion } from "motion/react";
import { ArrowRight, Check, Users } from "lucide-react";

function PassCard({ pass, onSelect, index = 0 }) {
  const available = Math.max(0, Number(pass.totalQuantity || 0) - Number(pass.soldQuantity || 0) - Number(pass.reservedQuantity || 0));
  const lowStock = available > 0 && available <= 10;
  const soldOut = available <= 0 || !pass.isActive;

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
      className="pass-card"
    >
        <div className="pass-card-top">
          <div>
            <span className="pass-type-pill">{pass.passType}</span>
            <h3 className="pass-name">{pass.name}</h3>
          </div>
          <span className={`pass-availability ${lowStock ? "is-low" : ""}`}>{soldOut ? "Unavailable" : lowStock ? `${available} left` : "Available"}</span>
        </div>
        <p className="pass-description">{pass.description || "Entry pass for this event."}</p>
        <div className="pass-price-row">
          <div>
            <p className="pass-price-label">Price per pass</p>
            <p className="pass-price">₹{Number(pass.price).toLocaleString("en-IN")}</p>
          </div>
          <div className="pass-members"><Users size={15} />{pass.membersCount} {pass.membersCount === 1 ? "entry" : "entries"}</div>
        </div>
        <ul className="pass-benefits">
          <li><Check size={14} />Digital QR ticket</li>
          <li><Check size={14} />Secure payment</li>
          <li><Check size={14} />QR-verified entry</li>
        </ul>
        <motion.button whileTap={{ scale: 0.98 }} disabled={soldOut} onClick={() => onSelect(pass)} className="pass-cta">
          {soldOut ? "Unavailable" : "Choose this pass"}{!soldOut && <ArrowRight size={15} />}
        </motion.button>
    </motion.article>
  );
}

export default PassCard;
