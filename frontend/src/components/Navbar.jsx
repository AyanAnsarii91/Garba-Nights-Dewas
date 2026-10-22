import { motion } from "motion/react";
import { ArrowUpRight, MapPin, Ticket } from "lucide-react";
import InstagramIcon from "./InstagramIcon.jsx";

function Navbar({ event }) {
  const instagramUrl =
    "https://www.instagram.com/dholki_nights_?utm_source=ig_web_button_share_sheet&rpxt=ZDNlZDc0MzIxNw==";

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="site-nav"
    >
      <nav className="site-nav-inner" aria-label="Main navigation">
        <a href="#top" className="brand-lockup">
          <span className="brand-mark"><Ticket size={20} /></span>
          <span><span className="brand-name">Dholki Nights</span><span className="brand-note">A night made to move</span></span>
        </a>
        <div className="nav-links">
          <a href="#passes">Passes</a>
          <a href="#event">The event</a>
          <a href="#privacy">Policy</a>
        </div>
        <div className="nav-meta">
          <MapPin size={15} />
          <span>{event?.venue?.name ? `${event.venue.name}, Dewas` : "Bhagatshree Garden, Dewas"}</span>
        </div>
        <div className="nav-actions">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="nav-instagram"
            aria-label="Follow Dholki Nights on Instagram"
            title="Follow @dholki_nights_ on Instagram"
          >
            <InstagramIcon size={17} />
            <span className="nav-instagram-text">@dholki_nights_</span>
          </a>
          <a className="nav-buy" href="#passes">Find your pass <ArrowUpRight size={15} /></a>
        </div>
      </nav>
    </motion.header>
  );
}

export default Navbar;
