import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Copy,
  Share2,
  CheckCircle2,
  Loader2,
  Link2,
  Sparkles,
} from "lucide-react";
import { API_BASE_URL } from "../services/apiConfig.js";

const WHATSAPP_MESSAGE = (code, link) =>
  `🥁 Hey! Join me for *Dholki Nights 2026* – the biggest Garba night in Dewas!\n\nBook your pass here 👇\n${link}\n\n_(Shared via Squad Code: ${code})_`;

function ReferralSection() {
  const [step, setStep] = useState("form"); // form | loading | done | error
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copyState, setCopyState] = useState("idle"); // idle | copied

  const handleGenerate = useCallback(
    async (e) => {
      e.preventDefault();
      setErrorMsg("");

      if (!name.trim()) {
        setErrorMsg("Please enter your name.");
        return;
      }
      if (!/^[6-9]\d{9}$/.test(phone.trim())) {
        setErrorMsg("Please enter a valid 10-digit Indian mobile number.");
        return;
      }

      setStep("loading");

      try {
        const res = await fetch(`${API_BASE_URL}/referrals/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: name.trim(),
            customerPhone: phone.trim(),
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Could not generate code.");
        }

        setCode(data.data.referral.code);
        setShareLink(data.data.referral.shareLink);
        setStep("done");
      } catch (err) {
        setErrorMsg(err.message || "Something went wrong. Please try again.");
        setStep("form");
      }
    },
    [name, phone],
  );

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2500);
    } catch {
      /* fallback: select text */
    }
  }, [shareLink]);

  const handleNativeShare = useCallback(async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: "Dholki Nights 2026 – Garba Night Dewas",
        text: `Join me at Dholki Nights 2026! Use my squad link:`,
        url: shareLink,
      });
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Share error:", err);
      }
    }
  }, [shareLink]);

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    WHATSAPP_MESSAGE(code, shareLink),
  )}`;

  return (
    <section className="referral-section" id="squad" aria-label="Invite friends">
      {/* Header */}
      <div className="referral-header">
        <div className="referral-kicker">
          <Sparkles size={14} />
          <span>Bring Your Squad</span>
        </div>
        <h2 className="referral-title">Invite friends to Dholki Nights</h2>
        <p className="referral-subtitle">
          Generate your personal squad link and share it with your crew. More
          friends, more fun – no limits on invites.
        </p>
      </div>

      <div className="referral-card">
        <AnimatePresence mode="wait">
          {/* ── FORM ── */}
          {step === "form" && (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleGenerate}
              className="referral-form"
              noValidate
            >
              <div className="referral-fields">
                <div className="referral-field">
                  <label htmlFor="ref-name" className="referral-label">
                    Your name
                  </label>
                  <input
                    id="ref-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="referral-input"
                    required
                  />
                </div>
                <div className="referral-field">
                  <label htmlFor="ref-phone" className="referral-label">
                    Mobile number
                  </label>
                  <input
                    id="ref-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="referral-input"
                    required
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="referral-error" role="alert">
                  {errorMsg}
                </p>
              )}

              <button type="submit" className="referral-generate-btn">
                <Users size={17} />
                Generate My Squad Link
              </button>

              <p className="referral-disclaimer">
                Returning? We'll retrieve your existing squad code automatically.
              </p>
            </motion.form>
          )}

          {/* ── LOADING ── */}
          {step === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="referral-loading"
            >
              <Loader2 size={30} className="referral-spinner" />
              <p>Creating your squad link…</p>
            </motion.div>
          )}

          {/* ── DONE ── */}
          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="referral-result"
            >
              {/* Code display */}
              <div className="referral-code-block">
                <div className="referral-code-label">
                  <CheckCircle2 size={15} className="referral-code-check" />
                  Your Squad Code
                </div>
                <div className="referral-code-value">{code}</div>
              </div>

              {/* Link display + copy */}
              <div className="referral-link-row">
                <div className="referral-link-display">
                  <Link2 size={14} className="referral-link-icon" />
                  <span className="referral-link-text">{shareLink}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`referral-copy-btn ${copyState === "copied" ? "is-copied" : ""}`}
                  aria-label="Copy referral link"
                >
                  {copyState === "copied" ? (
                    <>
                      <CheckCircle2 size={15} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={15} />
                      Copy Link
                    </>
                  )}
                </button>
              </div>

              {/* Share buttons */}
              <div className="referral-share-row">
                {/* WhatsApp */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="referral-share-btn referral-whatsapp"
                  aria-label="Share on WhatsApp"
                >
                  {/* WhatsApp SVG */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="17"
                    height="17"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  Share on WhatsApp
                </a>

                {/* Native share (only shown when supported) */}
                {typeof navigator !== "undefined" && navigator.share && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="referral-share-btn referral-native"
                    aria-label="Share via device"
                  >
                    <Share2 size={17} />
                    Share
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setCode("");
                  setShareLink("");
                }}
                className="referral-reset-link"
              >
                Generate for a different number
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom info strip */}
      <div className="referral-info-strip">
        <div className="referral-info-item">
          <span className="referral-info-num">∞</span>
          <span>Unlimited invites</span>
        </div>
        <div className="referral-info-divider" />
        <div className="referral-info-item">
          <span className="referral-info-num">🔗</span>
          <span>Unique squad link</span>
        </div>
        <div className="referral-info-divider" />
        <div className="referral-info-item">
          <span className="referral-info-num">📊</span>
          <span>Admin-tracked invites</span>
        </div>
      </div>
    </section>
  );
}

export default ReferralSection;
