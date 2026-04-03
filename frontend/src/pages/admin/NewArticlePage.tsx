import { Link } from "react-router-dom";
import ArticleEditor from "../../components/ArticleEditor";

export default function NewArticlePage() {
  return (
    <div className="fade-up" style={{ maxWidth: "860px", margin: "0 auto", padding: "4.5rem 1.5rem 7rem" }}>
      <div style={{ marginBottom: "2.5rem" }}>
        <Link to="/admin/dashboard" style={{ fontFamily: '"DM Sans", sans-serif', color: "#7A5C10", textDecoration: "none", fontSize: "0.83rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem", marginBottom: "1.5rem" }}>
          ← Dashboard
        </Link>
        <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#B8962E", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "0.4rem" }}>Admin</p>
        <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: "2.2rem", fontWeight: 900, color: "#0F1B35", margin: 0, letterSpacing: "-0.02em" }}>New Article</h1>
        <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#A8A29E", fontSize: "0.85rem", margin: "0.5rem 0 0" }}>
          Write your post below. Full Markdown supported — headings, bold, italic, blockquotes, and code.
        </p>
      </div>

      <div style={{ background: "#FFFFFF", border: "1px solid #EAE4D8", borderRadius: "0.875rem", padding: "2.75rem", boxShadow: "0 1px 8px rgba(28,25,23,0.06)" }}>
        <ArticleEditor mode="new" />
      </div>
    </div>
  );
}
