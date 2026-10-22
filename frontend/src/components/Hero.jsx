import { motion } from "motion/react";
import { ArrowDown, CalendarDays, MapPin, Sparkles } from "lucide-react";

function Hero({ event }) {
  const scrollToPasses = () => {
    document.getElementById("passes")?.scrollIntoView({ behavior: "smooth" });
  };

  const eventDate = event?.eventDate ? new Date(event.eventDate) : null;
  const validDate = eventDate && !Number.isNaN(eventDate.getTime());
  const formattedDate = validDate
    ? eventDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "Date to be announced";
  const posterDate = validDate
    ? eventDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()
    : "DATE TO BE ANNOUNCED";
  const posterImage = event?.bannerImage || "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1400&q=85";

  return (
    <section className="hero" id="top">
      <div className="hero-layout">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="hero-copy"
        >
          <div className="hero-kicker"><Sparkles size={14} /><span>{event?.venue?.address ? `${event.venue.name || "Bhagat Shree Marriage Garden"} · Dewas` : "Bhagat Shree Marriage Garden · Dewas"}</span></div>
          <h1 className="hero-title">{event?.name || "Dholki Nights 2026"}</h1>
          <p className="hero-description">{event?.description || "An unforgettable evening of Garba, music, dance and celebration."}</p>
          <div className="hero-facts">
            <div className="hero-fact"><CalendarDays size={16} />{formattedDate}</div>
            <div className="hero-fact"><MapPin size={16} />{event?.venue?.name || "BHAGAT SHREE MARRIAGE GARDEN, Dewas"}</div>
          </div>
          <div className="hero-actions">
            <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={scrollToPasses} className="button-primary">Explore passes <ArrowDown size={16} /></motion.button>
            <span className="hero-note">Digital tickets · QR entry</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="hero-poster-wrap"
        >
          <div className="hero-poster">
            <img src={posterImage} alt="Live music and dancing at an evening festival" />
            <div className="poster-top"><span className="poster-date">{posterDate}</span><span className="poster-stamp"><Sparkles size={22} /></span></div>
            <div className="poster-bottom">
              <div>
                <h2 className="poster-title">{event?.name || "Dholki Nights 2026"}</h2>
                <p className="poster-location"><MapPin size={14} />{event?.venue?.name || "BHAGAT SHREE MARRIAGE GARDEN"}{event?.venue?.address ? ` · ${event.venue.address}` : " · Raja Ram Nagar, Dewas"}</p>
              </div>
              <div className="poster-times"><span>DOORS</span><strong>{event?.startTime || "Time TBA"}</strong><span>UNTIL</span><strong>{event?.endTime || "Time TBA"}</strong></div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
