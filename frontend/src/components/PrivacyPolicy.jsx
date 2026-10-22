import { Clock, FileText, IdCard, Lock, ShieldCheck, UserCheck } from "lucide-react";

function PrivacyPolicy() {
  return (
    <section className="privacy-section" id="privacy" aria-labelledby="privacy-title">
      <div className="section-wrap">
        <div className="privacy-card-container">
          {/* Header */}
          <div className="privacy-header">
            <span className="section-kicker">Safety, Entry &amp; Privacy</span>
            <h2 id="privacy-title" className="privacy-main-title">
              Important Entry Guidelines &amp; Privacy Policy
            </h2>
            <p className="privacy-main-desc">
              Please review the mandatory gate entry requirements for Dholki Nights along with our complete commitment to your personal data privacy.
            </p>
          </div>

          {/* Primary Entry Policy Alerts */}
          <div className="privacy-critical-rules">
            <div className="privacy-rule-alert">
              <div className="rule-alert-icon">
                <IdCard size={24} />
              </div>
              <div className="rule-alert-content">
                <div className="rule-badge">Mandatory Entry Requirement 01</div>
                <h3>Keep your any type of government ID proof</h3>
                <p>
                  Every attendee must carry a valid physical or digital government photo ID (Aadhaar Card, Driving License, Voter ID, PAN Card, or Passport). ID verification is mandatory at the entrance alongside your digital ticket.
                </p>
              </div>
            </div>

            <div className="privacy-rule-alert warning">
              <div className="rule-alert-icon warning">
                <Clock size={24} />
              </div>
              <div className="rule-alert-content">
                <div className="rule-badge warning">Strict Gate Timing 02</div>
                <h3>After 8:30 PM there will be no entry for customers</h3>
                <p>
                  Entry gates will close strictly at 8:30 PM. No customer entry will be permitted under any circumstances after 8:30 PM. Please plan your travel to Bhagat Shree Marriage Garden Dewas in advance.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Policy Points Grid */}
          <div className="privacy-details-block">
            <div className="privacy-block-header">
              <div className="privacy-block-tag">
                <Lock size={15} />
                <span>Data Protection &amp; Confidentiality</span>
              </div>
              <h3 className="privacy-block-title">Your privacy, protected with care</h3>
            </div>

            <div className="privacy-grid">
              <div className="privacy-point-card">
                <div className="point-icon-wrap">
                  <UserCheck size={19} />
                </div>
                <h4>Information We Collect</h4>
                <p>
                  We collect only the essential details required to manage your booking: your full name, 10-digit mobile number, and optional email address for digital pass delivery.
                </p>
              </div>

              <div className="privacy-point-card">
                <div className="point-icon-wrap">
                  <ShieldCheck size={19} />
                </div>
                <h4>How Your Details Are Used</h4>
                <p>
                  Your details are used solely to issue your verifiable QR pass, send order confirmations, prevent duplicate admissions, and assist with event check-in.
                </p>
              </div>

              <div className="privacy-point-card">
                <div className="point-icon-wrap">
                  <Lock size={19} />
                </div>
                <h4>Secure Payments via PhonePe</h4>
                <p>
                  All transactions are handled with bank-grade encryption directly through PhonePe Payment Gateway. Dholki Nights never sees, handles, or stores sensitive card numbers or UPI PINs.
                </p>
              </div>

              <div className="privacy-point-card">
                <div className="point-icon-wrap">
                  <FileText size={19} />
                </div>
                <h4>No Third-Party Sharing</h4>
                <p>
                  Your personal information is strictly confidential. We do not sell, rent, or trade your personal data to external advertisers, marketers, or third parties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PrivacyPolicy;
