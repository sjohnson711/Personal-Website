import { Link } from "react-router-dom";
import { useState } from "react";

interface Article { id: number; title: string; slug: string; published: boolean; createdAt: string | Date; }
interface AdminArticleRowProps { article: Article; onDelete: (id: number) => void; }

export default function AdminArticleRow({ article, onDelete }: AdminArticleRowProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${article.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/articles/${article.id}`, { method: "DELETE", credentials: "include" });
    onDelete(article.id);
  }

  const dateStr = new Date(article.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto auto",
        gap: "1.25rem",
        alignItems: "center",
        padding: "1rem 1.75rem",
        borderBottom: "1px solid #F0EBE2",
        transition: "background 0.15s",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#1C1917", fontWeight: 600, fontSize: "0.93rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {article.title}
        </p>
        <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#C4BAB0", fontSize: "0.73rem", margin: "0.2rem 0 0" }}>
          /articles/{article.slug} &middot; {dateStr}
        </p>
      </div>

      <span className={article.published ? "badge badge-published" : "badge badge-draft"}>
        {article.published ? "Published" : "Draft"}
      </span>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Link to={`/admin/articles/${article.id}/edit`} className="btn-outline">Edit</Link>
        <button onClick={handleDelete} disabled={deleting} className="btn-danger">
          {deleting ? "…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
