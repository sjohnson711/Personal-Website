import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ArticleCard from "../components/ArticleCard";
import Pagination from "../components/Pagination";
import ScrollReveal from "../components/ScrollReveal";
import { api } from "../lib/api";
import { useIsMobile } from "../lib/useMediaQuery";

interface Article {
  title: string;
  slug: string;
  excerpt: string;
  createdAt: string;
}
interface ArticlesResponse {
  articles: Article[];
  total: number;
  page: number;
  totalPages: number;
}

export default function ArticlesPage() {
  const [searchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    api
      .get(`/articles?page=${page}`)
      .then((d: ArticlesResponse) => {
        if (!active) return;
        setArticles(d.articles ?? []);
        setTotal(d.total ?? 0);
        setTotalPages(d.totalPages ?? 1);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError(true);
        setLoading(false);
      });
    return () => { active = false; };
  }, [page, attempt]);

  const isMobile = useIsMobile();

  return (
    <div
      className="fade-up"
      style={{
        maxWidth: "780px",
        margin: "0 auto",
        padding: isMobile ? "3rem 1rem 4rem" : "5.5rem 1.5rem 7rem",
      }}
    >
      <header style={{ marginBottom: isMobile ? "2.25rem" : "4rem" }}>
        <p
          style={{
            fontFamily: '"DM Sans", sans-serif',
            color: "var(--color-gold-ink)",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom: "0.65rem",
          }}
        >
          Weekly Writing
        </p>
        <h1
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: "clamp(2.2rem, 4vw, 2.8rem)",
            fontWeight: 900,
            color: "var(--color-navy)",
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          Articles
        </h1>
        <div className="gold-rule" />
        {!loading && !error && total > 0 && (
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              color: "var(--color-slate)",
              fontSize: "0.82rem",
              margin: "1.25rem 0 0",
            }}
          >
            {total} article{total !== 1 ? "s" : ""} &mdash; page {page} of{" "}
            {totalPages}
          </p>
        )}
      </header>

      {loading ? (
        <div
          role="status"
          style={{
            color: "var(--color-slate)",
            textAlign: "center",
            padding: "4rem",
            fontFamily: '"DM Sans", sans-serif',
          }}
        >
          Loading…
        </div>
      ) : error ? (
        <div className="card no-lift" style={{ padding: "2rem", textAlign: "center" }}>
          <p role="alert" className="alert-error">We couldn't load the articles. Please try again.</p>
          <button type="button" className="btn-primary" onClick={() => setAttempt((value) => value + 1)} style={{ marginTop: "1rem" }}>
            Try again
          </button>
        </div>
      ) : articles.length === 0 ? (
        <div
          className="card no-lift"
          style={{ padding: isMobile ? "2rem 1.25rem" : "4rem", textAlign: "center" }}
        >
          <p style={{ color: "var(--color-slate)", fontFamily: '"DM Sans", sans-serif' }}>
            No articles yet — check back soon.
          </p>
        </div>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {articles.map((a, i) => (
            <ScrollReveal key={a.slug} delay={i * 0.07}>
              <ArticleCard {...a} />
            </ScrollReveal>
          ))}
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <div style={{ marginTop: "3rem" }}>
          <Pagination currentPage={page} totalPages={totalPages} />
        </div>
      )}
    </div>
  );
}
