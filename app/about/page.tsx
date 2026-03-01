import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Seth Johnson — [Book Title]",
  description:
    "Learn about [Author Name], the author of [Book Title]. Background, influences, and the story behind the book.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 flex flex-col gap-12">
      <header>
        <h1
          className="font-serif text-4xl font-bold"
          style={{ color: "#fbbf24" }}
        >
          About the Author
        </h1>
        <div
          style={{
            width: "60px",
            height: "4px",
            backgroundColor: "#217346",
            borderRadius: "2px",
            marginTop: "0.75rem",
          }}
        />
      </header>

      {/* Author photo + bio */}
      <section className="glass-card p-8 flex flex-col gap-8 md:flex-row md:gap-10">
        {/* Photo placeholder */}
        <div style={{ flexShrink: 0 }}>
          <div
            style={{
              width: "180px",
              height: "200px",
              backgroundColor: "rgba(33, 115, 70, 0.2)",
              border: "2px dashed rgba(64, 145, 108, 0.5)",
              borderRadius: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#40916c",
              fontSize: "0.8rem",
              letterSpacing: "0.05em",
              textAlign: "center",
              padding: "1rem",
            }}
          >
            AUTHOR<br />PHOTO
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2
            className="font-serif text-2xl font-bold"
            style={{ color: "#fbbf24" }}
          >
            Seth Johnson
          </h2>
``
          <p style={{ color: "#fff7ed", lineHeight: 1.8 }}>
            Seth Johnson is a Software Engineer | Mental Health Therapist with a passion for educating kids from impoverished communities.
            Born and raised in Georgia, they have spent the past 10 years
            in human services including being a former Residential Director for formerly known Carolina Youth and Development.
          </p>

          <p style={{ color: "#fff7ed", lineHeight: 1.8 }}>
            [Second paragraph about the author's background, education, or
            notable experiences. What shaped them into the writer they are
            today? What drives their work?]
          </p>

          <p style={{ color: "#fff7ed", lineHeight: 1.8 }}>
            [Author Name] lives in [location] with [family details if desired].
            When not writing, they enjoy [hobbies or interests].
          </p>
        </div>
      </section>

      {/* Credentials / Highlights */}
      <section className="flex flex-col gap-4">
        <h2
          className="font-serif text-xl font-bold"
          style={{ color: "#fbbf24" }}
        >
          Highlights
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "1rem",
          }}
        >
          {[
            {
              icon: "📚",
              title: "Published Works",
              desc: "[Previous books, articles, or publications]",
            },
            {
              icon: "🏆",
              title: "Awards & Recognition",
              desc: "[Any awards, honors, or notable recognition]",
            },
            {
              icon: "🎤",
              title: "Speaking",
              desc: "[Conferences, events, or speaking engagements]",
            },
            {
              icon: "🎓",
              title: "Education",
              desc: "[Degrees, institutions, or relevant training]",
            },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="glass-card p-5 flex flex-col gap-2"
            >
              <span style={{ fontSize: "1.5rem" }}>{icon}</span>
              <h3
                style={{
                  color: "#40916c",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                }}
              >
                {title}
              </h3>
              <p style={{ color: "#a89070", fontSize: "0.88rem", lineHeight: 1.6 }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact / Social */}
      <section className="glass-card p-8 flex flex-col gap-4">
        <h2
          className="font-serif text-xl font-bold"
          style={{ color: "#fbbf24" }}
        >
          Connect
        </h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {[
            { label: "Twitter / X", href: "#" },
            { label: "LinkedIn", href: "#" },
            { label: "Goodreads", href: "#" },
            { label: "Email", href: "mailto:author@example.com" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              style={{
                padding: "0.5rem 1.2rem",
                borderRadius: "2rem",
                border: "1px solid rgba(64, 145, 108, 0.5)",
                color: "#fff7ed",
                textDecoration: "none",
                fontSize: "0.9rem",
                transition: "all 0.2s",
              }}
            >
              {label}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
