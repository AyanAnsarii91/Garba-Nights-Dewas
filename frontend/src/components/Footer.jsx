import { ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";
import InstagramIcon from "./InstagramIcon.jsx";

function Footer() {
  const currentYear = new Date().getFullYear();
  const instagramUrl =
    "https://www.instagram.com/dholki_nights_?utm_source=ig_web_button_share_sheet&rpxt=ZDNlZDc0MzIxNw==";

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <div className="footer-brand-title">
            <strong>Dholki Nights</strong>
            <span className="footer-badge">
              <Sparkles size={11} /> Dewas 2026
            </span>
          </div>
          <p className="footer-tagline">
            Celebrate the rhythm, music, and energy of Garba. Join us at Bhagat Shree Marriage Garden Dewas for a night to remember.
          </p>
        </div>

        <div className="footer-actions">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="footer-instagram-card"
            aria-label="Follow Dholki Nights on Instagram"
          >
            <div className="footer-insta-icon">
              <InstagramIcon size={22} />
            </div>
            <div className="footer-insta-info">
              <span className="footer-insta-sub">Official Instagram</span>
              <strong className="footer-insta-handle">@dholki_nights_</strong>
            </div>
            <div className="footer-insta-arrow-wrap">
              <ArrowUpRight size={16} />
            </div>
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-legal">
          <a href="#privacy" className="footer-link">
            <ShieldCheck size={14} />
            <span>Privacy policy &amp; Guidelines</span>
          </a>
          <span className="footer-sep">·</span>
          <a href="#passes" className="footer-link">Find passes</a>
          <span className="footer-sep">·</span>
          <a href="#event" className="footer-link">Venue &amp; Map</a>
        </div>
        <p className="footer-copyright">
          © {currentYear} Dholki Nights · All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;