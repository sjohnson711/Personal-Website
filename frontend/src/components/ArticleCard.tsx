import { Link } from "react-router-dom";
import { useIsMobile } from "../lib/useMediaQuery";

interface ArticleCardProps { title: string; slug: string; excerpt: string; createdAt: string | Date; }

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function ArticleCard({ title, slug, excerpt, createdAt }: ArticleCardProps) {
  const isMobile = useIsMobile();
  return (
    <article
      className="card"
      style={{ padding: isMobile ? "1.25rem 1.25rem" : "1.75rem 2rem",
               display: "flex", flexDirection: "column", gap: "0.8rem" }}
    >
      <time
        dateTime={new Date(createdAt).toISOString()}
        style={{ fontFamily: '"DM Sans", sans-serif', color: "var(--color-gold-ink)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}
      >
        {formatDate(createdAt)}
      </time>

      <h2 style={{ margin: 0 }}>
        <Link
          to={`/articles/${slug}`}
          style={{ fontFamily: '"Playfair Display", Georgia, serif',
                   fontSize: isMobile ? "1.05rem" : "1.2rem",
                   fontWeight: 700, color: "var(--color-navy)", textDecoration: "none", lineHeight: 1.3 }}
        >
          {title}
        </Link>
      </h2>

      <p style={{ fontFamily: '"DM Sans", sans-serif', color: "var(--color-slate)", lineHeight: 1.75, fontSize: "0.93rem", margin: 0 }}>
        {excerpt}
      </p>

      <Link
        to={`/articles/${slug}`}
        style={{ fontFamily: '"DM Sans", sans-serif', color: "var(--color-gold-ink)", fontWeight: 600, fontSize: "0.83rem", textDecoration: "none", marginTop: "0.25rem", display: "inline-flex", alignItems: "center", gap: "0.25rem", letterSpacing: "0.02em" }}
      >
        Read more →
      </Link>
    </article>
  );
}
