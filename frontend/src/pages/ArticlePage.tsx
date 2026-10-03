import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import CommentSection from "../components/CommentSection";
import ShareButton from "../components/ShareButton";
import EmbedBlock from "../components/EmbedBlock";
import { api } from "../lib/api";
import { parseArticle, type ArticleSegment } from "../lib/parseArticle";
import { useIsMobile } from "../lib/useMediaQuery";

interface Article { id: number; title: string; excerpt: string; content: string; createdAt: string; published: boolean; }

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [segments, setSegments] = useState<ArticleSegment[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    setError(false);
    setArticle(null);
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    api
      .get(`/articles/${slug}`)
      .then((d: Article) => {
        if (!active) return;
        if (!d.published) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setArticle(d);
        setSegments(parseArticle(d.content));
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (err instanceof Error && "status" in err && err.status === 404) {
          setNotFound(true);
        } else {
          setError(true);
        }
        setLoading(false);
      });
    return () => { active = false; };
  }, [slug, attempt]);

  if (loading) return <div role="status" style={{ padding: "6rem", textAlign: "center", color: "var(--color-slate)", fontFamily: '"DM Sans", sans-serif' }}>Loading…</div>;

  if (error) return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "3rem 1rem" }}>
      <Link to="/articles" style={{ color: "var(--color-gold-ink)" }}>← Back to Articles</Link>
      <div className="card no-lift" style={{ padding: "2rem", textAlign: "center", marginTop: "2rem" }}>
        <p role="alert" className="alert-error">We couldn't load this article. Please try again.</p>
        <button type="button" className="btn-primary" onClick={() => setAttempt((value) => value + 1)} style={{ marginTop: "1rem" }}>
          Try again
        </button>
      </div>
    </div>
  );

  if (notFound || !article) return (
    <div style={{ maxWidth: "700px", margin: "0 auto",
                  padding: isMobile ? "3rem 1rem" : "5rem 1.5rem" }}>
      <Link to="/articles" style={{ fontFamily: '"DM Sans", sans-serif', color: "var(--color-gold-ink)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>← Back to Articles</Link>
      <div className="card no-lift" style={{ padding: isMobile ? "2rem 1.25rem" : "4rem", textAlign: "center", marginTop: "2rem" }}>
        <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: "1.65rem", color: "var(--color-navy)" }}>Article Not Found</h1>
        <p style={{ color: "var(--color-slate)", marginTop: "0.75rem" }}>This article doesn't exist or has been removed.</p>
      </div>
    </div>
  );

  const date = new Date(article.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="fade-up" style={{ maxWidth: "720px", margin: "0 auto",
                                       padding: isMobile ? "2.5rem 1rem 4rem" : "4rem 1.5rem 7rem",
                                       display: "flex", flexDirection: "column",
                                       gap: isMobile ? "1.25rem" : "2rem" }}>
      <Link to="/articles" style={{ fontFamily: '"DM Sans", sans-serif', color: "var(--color-gold-ink)", textDecoration: "none", fontSize: "0.83rem", fontWeight: 600, letterSpacing: "0.02em" }}>
        ← All Articles
      </Link>

      <article className="card no-lift" style={{ padding: isMobile ? "1.75rem 1.25rem" : "3rem 3.5rem" }}>
        <header style={{ marginBottom: isMobile ? "1.5rem" : "2.25rem",
                         paddingBottom: isMobile ? "1.25rem" : "2rem",
                         borderBottom: "1px solid #EAE4D8" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}>
            <time
              dateTime={new Date(article.createdAt).toISOString()}
              style={{ fontFamily: '"DM Sans", sans-serif', color: "var(--color-gold-ink)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}
            >
              {date}
            </time>
            <ShareButton title={article.title} excerpt={article.excerpt} />
          </div>
          <h1
            style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: "clamp(1.5rem, 6vw, 2.4rem)", fontWeight: 900, color: "var(--color-navy)", lineHeight: 1.15, margin: "0 0 1.1rem", letterSpacing: "-0.02em" }}
          >
            {article.title}
          </h1>
          <p style={{ fontFamily: '"DM Sans", sans-serif', color: "var(--color-slate)", fontStyle: "italic", lineHeight: 1.7,
                      fontSize: isMobile ? "0.92rem" : "1rem", margin: 0 }}>
            {article.excerpt}
          </p>
        </header>

        <div className="prose-ink">
          {segments.map((seg, i) =>
            seg.kind === "html" ? (
              <div key={i} dangerouslySetInnerHTML={{ __html: seg.html }} />
            ) : (
              <EmbedBlock key={i} url={seg.url} />
            ),
          )}
        </div>
      </article>

      <CommentSection articleId={article.id} />
    </div>
  );
}
