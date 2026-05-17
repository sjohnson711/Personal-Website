import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { marked } from "marked";
import CommentSection from "../components/CommentSection";
import ShareButton from "../components/ShareButton";
import { api } from "../lib/api";

interface Article { id: number; title: string; excerpt: string; content: string; createdAt: string; published: boolean; }

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [html, setHtml] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api
      .get(`/articles/${slug}`)
      .then(async (d: Article) => {
        if (!d.published) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setArticle(d);
        setHtml(await marked(d.content));
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <div style={{ padding: "6rem", textAlign: "center", color: "#A8A29E", fontFamily: '"DM Sans", sans-serif' }}>Loading…</div>;

  if (notFound || !article) return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "5rem 1.5rem" }}>
      <Link to="/articles" style={{ fontFamily: '"DM Sans", sans-serif', color: "#7A5C10", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>← Back to Articles</Link>
      <div className="card no-lift" style={{ padding: "4rem", textAlign: "center", marginTop: "2rem" }}>
        <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: "1.65rem", color: "#0F1B35" }}>Article Not Found</h1>
        <p style={{ color: "#A8A29E", marginTop: "0.75rem" }}>This article doesn't exist or has been removed.</p>
      </div>
    </div>
  );

  const date = new Date(article.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="fade-up" style={{ maxWidth: "720px", margin: "0 auto", padding: "4rem 1.5rem 7rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
      <Link to="/articles" style={{ fontFamily: '"DM Sans", sans-serif', color: "#7A5C10", textDecoration: "none", fontSize: "0.83rem", fontWeight: 600, letterSpacing: "0.02em" }}>
        ← All Articles
      </Link>

      <article className="card no-lift" style={{ padding: "3rem 3.5rem" }}>
        <header style={{ marginBottom: "2.25rem", paddingBottom: "2rem", borderBottom: "1px solid #EAE4D8" }}>
          <time
            dateTime={new Date(article.createdAt).toISOString()}
            style={{ fontFamily: '"DM Sans", sans-serif', color: "#B8962E", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: "1rem" }}
          >
            {date}
          </time>
          <h1
            style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: "clamp(1.75rem, 3.5vw, 2.4rem)", fontWeight: 900, color: "#0F1B35", lineHeight: 1.15, margin: "0 0 1.1rem", letterSpacing: "-0.02em" }}
          >
            {article.title}
          </h1>
          <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#6B6560", fontStyle: "italic", lineHeight: 1.7, fontSize: "1rem", margin: "0 0 1.5rem" }}>
            {article.excerpt}
          </p>
          <ShareButton title={article.title} excerpt={article.excerpt} />
        </header>

        <div className="prose-ink" dangerouslySetInnerHTML={{ __html: html }} />
      </article>

      <CommentSection articleId={article.id} />
    </div>
  );
}
