import {
  CalendarDays,
  Clock3,
  ExternalLink,
  MapPin,
  Navigation,
  ShieldCheck,
} from "lucide-react";

function EventInfo({ event }) {
  const venueName = event?.venue?.name || "BHAGAT SHREE MARRIAGE GARDEN";
  const venueAddress = event?.venue?.address || "Raja Ram Nagar, Dewas, Madhya Pradesh 455001";
  const latitude = event?.venue?.coordinates?.latitude ?? 22.963353;
  const longitude = event?.venue?.coordinates?.longitude ?? 76.027915;

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  const embedMapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&hl=en&z=16&output=embed`;

  const formattedDate = event?.eventDate
    ? new Date(event.eventDate).toLocaleDateString(
        "en-IN",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      )
    : "Sunday, 25 October 2026";

  return (
    <section id="event" className="event-section">
      <div className="section-wrap">
        <div className="event-grid">
          <div>
            <p className="section-kicker">The gathering</p>
            <h2 className="section-title">A little more about the night.</h2>
            <p className="event-description">
              {event?.description || "An unforgettable evening of Garba, music, dance and celebration."}
            </p>
            <div className="event-details">
              <InfoItem
                icon={CalendarDays}
                title="Date"
                value={formattedDate}
              />

              <InfoItem
                icon={Clock3}
                title="Time"
                value={[event?.startTime || "06:00 PM", event?.endTime || "11:00 PM"].filter(Boolean).join(" – ")}
              />

              <InfoItem
                icon={MapPin}
                title="Venue"
                value={`${venueName} · Dewas`}
              />

              <InfoItem
                icon={ShieldCheck}
                title="Entry"
                value="Govt ID + Secure QR (Closes 8:30 PM)"
              />
            </div>
          </div>

          <div className="venue-card-wrapper" aria-label="Event venue location">
            <div className="venue-map-frame-box">
              <iframe
                title="Venue Location - Bhagat Shree Marriage Garden Dewas"
                src={embedMapUrl}
                className="venue-embedded-map"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="venue-info-box">
              <div className="venue-info-header">
                <div className="venue-pin-badge">
                  <MapPin size={18} />
                </div>
                <div>
                  <span className="venue-location-kicker">Event Location</span>
                  <h3 className="venue-location-name">{venueName}</h3>
                </div>
              </div>

              <p className="venue-location-address">{venueAddress}</p>

              <div className="venue-coords-strip">
                <span className="venue-coords-label">GPS: {latitude}, {longitude}</span>
              </div>

              <div className="venue-actions">
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="venue-maps-btn"
                >
                  <Navigation size={15} />
                  <span>See Location on Google Maps</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoItem({
  icon: Icon,
  title,
  value,
}) {
  return (
    <div className="event-detail">
      <Icon size={17} />
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default EventInfo;