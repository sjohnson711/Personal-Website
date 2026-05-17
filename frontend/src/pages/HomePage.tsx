import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ArticleCard from "../components/ArticleCard";
import HeroImageCarousel from "../components/HeroImageCarousel";
import { api } from "../lib/api";

interface Article {
  title: string;
  slug: string;
  excerpt: string;
  createdAt: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const data = await api.post("/subscribers", { email });
      setStatus("success");
      setMsg(data.message ?? "Subscribed!");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMsg(
        err instanceof Error ? err.message : "Network error — please try again."
      );
    }
  }

  return (
    <section style={{ paddingBottom: "7rem" }}>
      <div style={{ background: "#0F1B35", borderRadius: "1rem", padding: "3.5rem 4rem",
                    display: "grid", gridTemplateColumns: "1fr auto", gap: "3rem",
                    alignItems: "center", boxShadow: "0 8px 40px rgba(15,27,53,0.18)" }}>
        <div>
          <p style={{ fontFamily: '"DM Sans",sans-serif', color: "#B8962E", fontSize: "0.7rem",
                      fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase",
                      marginBottom: "0.6rem" }}>Newsletter</p>
          <h2 style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: "1.65rem",
                       fontWeight: 700, color: "#F7F4EF", margin: "0 0 0.6rem", lineHeight: 1.2 }}>
            Stay in the Loop
          </h2>
          <p style={{ fontFamily: '"DM Sans",sans-serif', color: "#9A9490", fontSize: "0.95rem",
                      lineHeight: 1.65, margin: 0 }}>
            Weekly articles on faith, tech, mental health, and community — delivered to your inbox.
            Unsubscribe anytime.
          </p>
        </div>

        <div style={{ flexShrink: 0 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.75rem" }}>
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading" || status === "success"}
              style={{ padding: "0.72rem 1rem", borderRadius: "0.5rem",
                       border: "1px solid rgba(255,255,255,0.12)",
                       background: "rgba(255,255,255,0.07)", color: "#F7F4EF",
                       fontSize: "0.93rem", fontFamily: '"DM Sans",sans-serif',
                       outline: "none", minWidth: "220px" }}
            />
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              style={{ padding: "0.72rem 1.6rem", borderRadius: "0.5rem",
                       background: status === "success" ? "#40916C" : "#B8962E",
                       color: "#0F1B35", fontFamily: '"DM Sans",sans-serif',
                       fontWeight: 700, fontSize: "0.92rem", border: "none",
                       cursor: status === "loading" || status === "success" ? "default" : "pointer",
                       whiteSpace: "nowrap" }}>
              {status === "loading" ? "Subscribing…" : status === "success" ? "Subscribed ✓" : "Subscribe"}
            </button>
          </form>
          {msg && (
            <p style={{ marginTop: "0.6rem", fontSize: "0.82rem",
                        color: status === "success" ? "#40916C" : "#E57373",
                        fontFamily: '"DM Sans",sans-serif' }}>
              {msg}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function useScrollReveal(count: number) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("visible");
            obs.unobserve(e.target);
          }
        }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    refs.current.forEach((el) => {
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [count]);
  return refs;
}

export default function HomePage() {
  const [latest, setLatest] = useState<Article[]>([]);

  useEffect(() => {
    api
      .get("/articles?page=1")
      .then((d: { articles?: Article[] }) =>
        setLatest((d.articles ?? []).slice(0, 3)),
      )
      .catch(() => {});
  }, []);

  const cardRefs = useScrollReveal(latest.length);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1.5rem" }}>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4rem",
          alignItems: "center",
          padding: "7rem 0 6rem",
          animation: "fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        {/* Ambient orbs */}
        <div className="hero-orb hero-orb-gold" />
        <div className="hero-orb hero-orb-navy" />

        {/* Photo mosaic */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "230px 175px",
            gap: "0.75rem",
            position: "relative",
            zIndex: 1,
          }}
        >
          <HeroImageCarousel />
          <img
            src="/hero-woman-tech.jpg"
            alt="Woman of color working in tech"
            style={{
              gridColumn: "2",
              gridRow: "1",
              objectFit: "cover",
              borderRadius: "0.75rem",
              width: "100%",
              height: "100%",
              boxShadow: "0 8px 32px rgba(28,25,23,0.12)",
            }}
          />
          <div
            style={{
              gridColumn: "2",
              gridRow: "2",
              borderRadius: "0.75rem",
              background: "linear-gradient(135deg, #0F1B35 0%, #1E2E52 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "center",
              padding: "1.25rem 1.5rem",
              gap: "0.35rem",
            }}
          >
            <span
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                color: "#B8962E",
                fontSize: "1.65rem",
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              Weekly
            </span>
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                color: "#EFE9DE",
                fontSize: "0.72rem",
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                lineHeight: 1.4,
              }}
            >
              Faith to Mind &
              <br />
              Community
            </span>
          </div>
        </div>

        {/* Latest article copy */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.75rem",
            position: "relative",
            zIndex: 1,
          }}
        >
          {latest[0] ? (
            <>
              <div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.32rem 0.9rem",
                    borderRadius: "2rem",
                    background: "rgba(184,150,46,0.1)",
                    border: "1px solid rgba(184,150,46,0.3)",
                    color: "#7A5C10",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    fontFamily: '"DM Sans", sans-serif',
                    marginBottom: "1.25rem",
                  }}
                >
                  <span
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: "#B8962E",
                      display: "inline-block",
                    }}
                  />
                  Latest Article · {formatDate(latest[0].createdAt)}
                </span>

                <h1
                  style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: "clamp(1.9rem, 3.5vw, 2.9rem)",
                    fontWeight: 900,
                    color: "#0F1B35",
                    lineHeight: 1.15,
                    letterSpacing: "-0.02em",
                    margin: 0,
                  }}
                >
                  {latest[0].title}
                </h1>
              </div>

              <p
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  color: "#6B6560",
                  fontSize: "1.05rem",
                  lineHeight: 1.85,
                  maxWidth: "500px",
                  margin: 0,
                }}
              >
                {latest[0].excerpt}
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1.25rem",
                  borderRadius: "0.75rem",
                  background: "rgba(184,150,46,0.08)",
                  border: "1px solid rgba(184,150,46,0.15)",
                }}
              >
                <img
                  src="/profile library pic.png"
                  alt="Seth Johnson"
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                    border: "2px solid rgba(184,150,46,0.3)",
                  }}
                />
                <div>
                  <p
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontWeight: 700,
                      color: "#0F1B35",
                      fontSize: "0.9rem",
                      margin: "0 0 0.25rem",
                    }}
                  >
                    Seth Johnson
                  </p>
                  <p
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      color: "#6B6560",
                      fontSize: "0.8rem",
                      margin: 0,
                    }}
                  >
                    Author & Creator
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.9rem", flexWrap: "wrap" }}>
                <Link
                  to={`/articles/${latest[0].slug}`}
                  className="btn-primary"
                  style={{ fontSize: "0.95rem", padding: "0.8rem 2rem" }}
                >
                  Read Article →
                </Link>
                <Link
                  to="/articles"
                  className="btn-ghost"
                  style={{ fontSize: "0.95rem", padding: "0.8rem 1.75rem" }}
                >
                  All Articles
                </Link>
              </div>
            </>
          ) : (
            <>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.32rem 0.9rem",
                  borderRadius: "2rem",
                  background: "rgba(184,150,46,0.1)",
                  border: "1px solid rgba(184,150,46,0.3)",
                  color: "#7A5C10",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  fontFamily: '"DM Sans", sans-serif',
                  alignSelf: "flex-start",
                }}
              >
                <span
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: "#B8962E",
                    display: "inline-block",
                  }}
                />
                Weekly Writing
              </span>
              <h1
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: "clamp(1.9rem, 3.5vw, 2.9rem)",
                  fontWeight: 900,
                  color: "#0F1B35",
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  margin: 0,
                }}
              >
                Seth Johnson
              </h1>
              <Link
                to="/articles"
                className="btn-primary"
                style={{
                  fontSize: "0.95rem",
                  padding: "0.8rem 2rem",
                  alignSelf: "flex-start",
                }}
              >
                Read Articles →
              </Link>
            </>
          )}
        </div>
      </section>

      <hr className="divider" />

      {/* ── Latest Posts ─────────────────────────────────── */}
      {latest.length > 0 && (
        <section style={{ padding: "6rem 0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: "3rem",
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  color: "#B8962E",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem",
                }}
              >
                From the Blog
              </p>
              <h2 className="section-title">Latest Posts</h2>
            </div>
            <Link
              to="/articles"
              style={{
                fontFamily: '"DM Sans", sans-serif',
                color: "#B8962E",
                fontSize: "0.86rem",
                fontWeight: 600,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              View all →
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {latest.map((a, i) => (
              <div
                key={a.slug}
                className="reveal"
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <ArticleCard {...a} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Newsletter ───────────────────────────────────── */}
      <NewsletterSection />
    </div>
  );
}
