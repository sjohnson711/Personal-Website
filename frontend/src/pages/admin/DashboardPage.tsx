import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminArticleRow from "../../components/AdminArticleRow";
import { api } from "../../lib/api";
import { useBreakpoint, useIsMobile } from "../../lib/useMediaQuery";

interface Article { id: number; title: string; slug: string; published: boolean; createdAt: string; }
interface ArticlesResponse { articles: Article[]; total: number; }

export default function DashboardPage() {
  const { email } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const bp = useBreakpoint();

  useEffect(() => {
    api
      .get("/articles?admin=true&page=1")
      .then((d: ArticlesResponse) => {
        setArticles(d.articles ?? []);
        setTotal(d.total ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleDelete(id: number) {
    setArticles((p) => p.filter((a) => a.id !== id));
    setTotal((p) => p - 1);
  }

  const published = articles.filter((a) => a.published).length;
  const drafts    = articles.filter((a) => !a.published).length;

  return (
    <div className="fade-up" style={{ maxWidth: "980px", margin: "0 auto",
                                       padding: isMobile ? "3rem 1rem 4rem" : "4.5rem 1.5rem 7rem" }}>

      {/* Top bar */}
      <div style={{ display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "stretch" : "flex-start",
                    justifyContent: "space-between", flexWrap: "wrap",
                    gap: isMobile ? "1.25rem" : "1.25rem",
                    marginBottom: isMobile ? "1.75rem" : "3rem" }}>
        <div>
          <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#B8962E", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "0.4rem" }}>Admin</p>
          <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif',
                       fontSize: "clamp(1.55rem, 6vw, 2.2rem)",
                       fontWeight: 900, color: "#0F1B35", margin: 0, letterSpacing: "-0.02em" }}>Dashboard</h1>
          <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#A8A29E", fontSize: "0.82rem", margin: "0.4rem 0 0",
                      wordBreak: "break-word" }}>
            Signed in as <span style={{ color: "#7A5C10", fontWeight: 600 }}>{email}</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link to="/admin/articles/new" className="btn-primary"
                style={isMobile ? { flex: 1, textAlign: "center" } : undefined}>+ New Article</Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid",
                    gridTemplateColumns: bp === "mobile"
                      ? "1fr"
                      : bp === "tablet"
                        ? "repeat(2, 1fr)"
                        : "repeat(3, 1fr)",
                    gap: "1rem",
                    marginBottom: isMobile ? "1.75rem" : "2.5rem" }}>
        {[{ label: "Total Articles", value: total }, { label: "Published", value: published }, { label: "Drafts", value: drafts }].map(({ label, value }) => (
          <div key={label} className="stat-card">
            <div className="stat-number">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#FFFFFF", border: "1px solid #EAE4D8", borderRadius: "0.875rem", overflow: "hidden", boxShadow: "0 1px 8px rgba(28,25,23,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: isMobile ? "0.9rem 1.25rem" : "1.1rem 1.75rem",
                      borderBottom: "1px solid #F0EBE2", background: "#FAFAF9" }}>
          <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: "1rem", fontWeight: 700, color: "#0F1B35", margin: 0 }}>All Articles</h2>
          <span style={{ fontFamily: '"DM Sans", sans-serif', color: "#C4BAB0", fontSize: "0.75rem" }}>{total} total</span>
        </div>

        {loading ? (
          <div style={{ padding: isMobile ? "2rem" : "3.5rem", textAlign: "center", color: "#C4BAB0", fontFamily: '"DM Sans", sans-serif' }}>Loading…</div>
        ) : articles.length === 0 ? (
          <div style={{ padding: isMobile ? "2rem 1.25rem" : "3.5rem", textAlign: "center" }}>
            <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#C4BAB0", marginBottom: "1rem" }}>No articles yet.</p>
            <Link to="/admin/articles/new" className="btn-primary" style={{ display: "inline-flex" }}>Write your first article</Link>
          </div>
        ) : (
          articles.map((a) => <AdminArticleRow key={a.id} article={a} onDelete={handleDelete} />)
        )}
      </div>
    </div>
  );
}
