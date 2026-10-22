import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, HeartHandshake, QrCode, RefreshCw } from "lucide-react";

import { getEventBySlug, trackReferralVisit } from "../services/api.js";

import Navbar from "../components/Navbar.jsx";
import Hero from "../components/Hero.jsx";
import PassSelector from "../components/PassSelector.jsx";
import EventInfo from "../components/EventInfo.jsx";
import ReferralSection from "../components/ReferralSection.jsx";
import PrivacyPolicy from "../components/PrivacyPolicy.jsx";
import Footer from "../components/Footer.jsx";

const REFERRAL_CODE_KEY = "dholki_ref_code";

const sanitizeRef = (raw) => {
  if (!raw) return "";
  return String(raw)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 20);
};

function Home() {
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ── Capture ?ref= on first load ── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rawRef = params.get("ref");
    const cleanRef = sanitizeRef(rawRef);

    if (cleanRef) {
      /* Persist for the whole booking session */
      sessionStorage.setItem(REFERRAL_CODE_KEY, cleanRef);

      /* Fire-and-forget visit track (non-blocking) */
      trackReferralVisit(cleanRef).catch(() => {/* silent */ });

      /* Strip the ref param from the URL without a page reload */
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("ref");
      window.history.replaceState({}, "", cleanUrl.toString());
    }
  }, []);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getEventBySlug("garba-night-2026");
        setEvent(response.data.event);
        setPasses(response.data.passes);
      } catch (error) {
        console.error("Event loading error:", error);
        setError(error.message || "Unable to load event");
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, []);

  const handleSelectPass = (pass) => {
    navigate("/checkout", {
      state: {
        event,
        pass,
      },
    });
  };

  if (loading) {
    return (
      <div className="status-state">
        <div className="status-card">
          <div className="status-spinner" />
          <p>Setting the scene...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-state">
        <div className="status-card">
          <RefreshCw className="status-icon mx-auto" size={30} />
          <h1>Couldn't load the event</h1>
          <p>{error}</p>
          <button className="button-primary mt-6" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="public-site">
      <Navbar event={event} />
      <Hero event={event} />

      <section className="trust-strip" aria-label="Booking benefits">
        <div className="trust-item">
          <div className="trust-icon"><QrCode size={18} /></div>
          <div><strong>Digital entry pass</strong><span>Ready on your phone</span></div>
        </div>
        <div className="trust-item">
          <div className="trust-icon"><BadgeCheck size={18} /></div>
          <div><strong>Verified booking</strong><span>Secure payment confirmation</span></div>
        </div>
        <div className="trust-item">
          <div className="trust-icon"><HeartHandshake size={18} /></div>
          <div><strong>Made for your crew</strong><span>Pass options for every plan</span></div>
        </div>
      </section>

      <PassSelector passes={passes} onSelect={handleSelectPass} />
      <EventInfo event={event} />

      {/* ── Squad Referral Section ── */}
      <ReferralSection />

      <PrivacyPolicy />
      <Footer />
    </div>
  );
}

export default Home;