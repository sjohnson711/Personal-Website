import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ArticleEditor from "../../components/ArticleEditor";
import { api } from "../../lib/api";
import { useIsMobile } from "../../lib/useMediaQuery";

interface Article { id: number; title: string; slug: string; excerpt: string; content: string; published: boolean; }

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!id) return;
    api
      .get(`/articles/${id}`)
      .then((article: Article) => {
        setArticle(article);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <div style={{ padding: "6rem", textAlign: "center", fontFamily: '"DM Sans", sans-serif', color: "#A8A29E" }}>Loading…</div>
  );

  if (notFound || !article) return (
    <div style={{ maxWidth: "860px", margin: "0 auto",
                  padding: isMobile ? "3rem 1rem" : "4.5rem 1.5rem" }}>
      <Link to="/admin/dashboard" style={{ fontFamily: '"DM Sans", sans-serif', color: "#7A5C10", textDecoration: "none", fontSize: "0.83rem", fontWeight: 600 }}>← Dashboard</Link>
      <div style={{ background: "#FFFFFF", border: "1px solid #EAE4D8", borderRadius: "0.875rem",
                    padding: isMobile ? "2rem 1.25rem" : "4rem",
                    textAlign: "center", marginTop: "2rem" }}>
        <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: "1.65rem", color: "#0F1B35" }}>Article Not Found</h1>
        <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#A8A29E", marginTop: "0.75rem" }}>This article doesn't exist or has been removed.</p>
      </div>
    </div>
  );

  return (
    <div className="fade-up" style={{ maxWidth: "860px", margin: "0 auto",
                                      padding: isMobile ? "3rem 1rem 4rem" : "4.5rem 1.5rem 7rem" }}>
      <div style={{ marginBottom: isMobile ? "1.5rem" : "2.5rem" }}>
        <Link to="/admin/dashboard" style={{ fontFamily: '"DM Sans", sans-serif', color: "#7A5C10", textDecoration: "none", fontSize: "0.83rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem", marginBottom: "1.5rem" }}>
          ← Dashboard
        </Link>
        <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#B8962E", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "0.4rem" }}>Admin</p>
        <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif',
                     fontSize: "clamp(1.55rem, 6vw, 2.2rem)",
                     fontWeight: 900, color: "#0F1B35", margin: 0, letterSpacing: "-0.02em" }}>Edit Article</h1>
        <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#A8A29E", fontSize: "0.85rem", margin: "0.5rem 0 0",
                    wordBreak: "break-word" }}>
          Editing: <span style={{ color: "#6B6560" }}>{article.title}</span>
        </p>
      </div>

      <div style={{ background: "#FFFFFF", border: "1px solid #EAE4D8", borderRadius: "0.875rem",
                    padding: isMobile ? "1.5rem 1.25rem" : "2.75rem",
                    boxShadow: "0 1px 8px rgba(28,25,23,0.06)" }}>
        <ArticleEditor mode="edit" initialData={article} />
      </div>
    </div>
  );
}
