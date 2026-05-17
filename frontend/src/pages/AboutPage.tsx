import { useState } from "react";
import ContactModal from "../components/ContactModal";

export default function AboutPage() {
  const [showContact, setShowContact] = useState(false);
  const highlights = [
    { label: "Published Works",  value: "[Books, articles, or publications]" },
    { label: "Speaking",         value: "Beyond the Armor Podcast" },
    { label: "Awards",           value: "Honors: AI-Applied Engineering (CodePath)" },
    { label: "Education",        value: "M.A. Clinical Mental Health Counseling (Webster University); B.S. Child, Youth & Development, Minor in Biblical Studies" },
  ];
  const social = [
    { label: "Twitter / X", href: "#" },
    { label: "LinkedIn",    href: "https://www.linkedin.com/in/seth-johnson-10a6a217b/" },
    { label: "Goodreads",   href: "#" },
    { label: "Email",       href: "contact" },
  ];

  return (
    <div className="fade-up" style={{ maxWidth: "860px", margin: "0 auto", padding: "5.5rem 1.5rem 7rem" }}>

      <header style={{ marginBottom: "4rem" }}>
        <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#B8962E", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "0.65rem" }}>
          The Author
        </p>
        <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: "clamp(2.2rem, 4vw, 2.8rem)", fontWeight: 900, color: "#0F1B35", margin: 0, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
          About Seth Johnson
        </h1>
        <div className="gold-rule" />
      </header>

      {/* Bio card */}
      <section className="card no-lift" style={{ padding: "2.75rem", display: "grid", gridTemplateColumns: "auto 1fr", gap: "2.75rem", alignItems: "flex-start", marginBottom: "2rem" }}>
        <img
          src="/Proifleofficepic.png"
          alt="Seth Johnson"
          style={{
            width: "155px", height: "195px", flexShrink: 0, borderRadius: "0.6rem",
            objectFit: "cover", objectPosition: "center",
            border: "1px solid #D8D0C4",
            boxShadow: "0 2px 12px rgba(28,25,23,0.08)",
            imageRendering: "auto",
            WebkitFontSmoothing: "antialiased",
            backfaceVisibility: "hidden",
            marginTop: "8rem",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div>
            <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: "1.65rem", fontWeight: 700, color: "#0F1B35", margin: "0 0 0.3rem" }}>Seth Johnson</h2>
            <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#B8962E", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
              Software Engineer &amp; Mental Health Therapist
            </p>
          </div>
          <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#4A4540", lineHeight: 1.85, margin: 0, fontSize: "0.97rem" }}>
            Seth Johnson is a Software Engineer and Mental Health Therapist with a passion for educating kids from impoverished communities. Born and raised in Georgia, Seth has spent over a decade in human services, including serving as a former Residential Program Director at Landmark for Families in Charleston, South Carolina.
          </p>
          <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#6B6560", lineHeight: 1.85, margin: 0, fontSize: "0.95rem" }}>
            With a <span style={{ fontWeight: 600, color: "#4A4540" }}>Master's in Clinical Mental Health Counseling</span> and a decade of community work, Seth's transition to technology was intentional—an expansion of his mission, not an escape. A <span style={{ fontWeight: 600, color: "#4A4540" }}>Code The Dream full-stack graduate</span> with certifications in <span style={{ fontWeight: 600, color: "#4A4540" }}>AI Applied Engineering and Technical Interviewing through CodePath</span>, Seth combines deep expertise in React and Node.js with his commitment to equity. Today, as a <span style={{ fontWeight: 600, color: "#4A4540" }}>CodePath Tech Fellow and Code The Dream mentor</span>, he uses technology to expand opportunity in underserved communities.
          </p>
        </div>
      </section>

      {/* Highlights */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: "1.35rem", fontWeight: 700, color: "#0F1B35", marginBottom: "1.25rem" }}>Highlights</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(195px, 1fr))", gap: "1rem" }}>
          {highlights.map(({ label, value }) => (
            <div key={label} style={{ background: "#FFFFFF", border: "1px solid #EAE4D8", borderRadius: "0.75rem", padding: "1.25rem", boxShadow: "0 1px 4px rgba(28,25,23,0.05)" }}>
              <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#B8962E", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", margin: "0 0 0.5rem" }}>{label}</p>
              <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#6B6560", fontSize: "0.87rem", lineHeight: 1.55, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Connect */}
      <section className="card no-lift" style={{ padding: "2rem 2.5rem" }}>
        <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: "1.35rem", fontWeight: 700, color: "#0F1B35", marginBottom: "1.25rem" }}>Connect</h2>
        <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
          {social.map(({ label, href }) => {
            const isExternal = href.startsWith("http");
            const isContact = href === "contact";

            if (isContact) {
              return (
                <button
                  key={label}
                  onClick={() => setShowContact(true)}
                  className="btn-outline"
                  style={{ borderRadius: "2rem", border: "1px solid rgba(184, 150, 46, 0.45)" }}
                >
                  {label}
                </button>
              );
            }

            return (
              <a
                key={label}
                href={href}
                className="btn-outline"
                style={{ borderRadius: "2rem" }}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
              >
                {label}
              </a>
            );
          })}
        </div>
      </section>

      <ContactModal isOpen={showContact} onClose={() => setShowContact(false)} />
    </div>
  );
}
