import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ArticleCard from "../components/ArticleCard";
import Pagination from "../components/Pagination";

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
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
    );
    refs.current.forEach((el) => {
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [count]);
  return refs;
}

export default function ArticlesPage() {
  const [searchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/articles?page=${page}`)
      .then((r) => r.json())
      .then((d: ArticlesResponse) => {
        setArticles(d.articles ?? []);
        setTotal(d.total ?? 0);
        setTotalPages(d.totalPages ?? 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page]);

  const cardRefs = useScrollReveal(articles.length);

  return (
    <div
      className="fade-up"
      style={{
        maxWidth: "780px",
        margin: "0 auto",
        padding: "5.5rem 1.5rem 7rem",
      }}
    >
      <header style={{ marginBottom: "4rem" }}>
        <p
          style={{
            fontFamily: '"DM Sans", sans-serif',
            color: "#B8962E",
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
            color: "#0F1B35",
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          Articles
        </h1>
        <div className="gold-rule" />
        {total > 0 && (
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              color: "#A8A29E",
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
          style={{
            color: "#A8A29E",
            textAlign: "center",
            padding: "4rem",
            fontFamily: '"DM Sans", sans-serif',
          }}
        >
          Loading…
        </div>
      ) : articles.length === 0 ? (
        <div
          className="card no-lift"
          style={{ padding: "4rem", textAlign: "center" }}
        >
          <p style={{ color: "#A8A29E", fontFamily: '"DM Sans", sans-serif' }}>
            No articles yet — check back soon.
          </p>
        </div>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {articles.map((a, i) => (
            <div
              key={a.slug}
              className="reveal"
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              <ArticleCard {...a} />
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ marginTop: "3rem" }}>
          <Pagination currentPage={page} totalPages={totalPages} />
        </div>
      )}
    </div>
  );
}
