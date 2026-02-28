"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Article {
  id: number;
  title: string;
  slug: string;
  published: boolean;
  createdAt: Date;
}

export default function AdminArticleRow({ article }: { article: Article }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${article.title}"? This cannot be undone.`)) return;
    setDeleting(true);

    await fetch(`/api/articles/${article.id}`, { method: "DELETE" });
    router.refresh();
  }

  const dateStr = new Date(article.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      style={{
        padding: "1rem 1.5rem",
        borderBottom: "1px solid rgba(64, 145, 108, 0.15)",
        display: "grid",
        gridTemplateColumns: "1fr auto auto",
        gap: "1rem",
        alignItems: "center",
      }}
    >
      <div>
        <p style={{ color: "#fff7ed", fontWeight: 600, fontSize: "0.95rem" }}>
          {article.title}
        </p>
        <p style={{ color: "#a89070", fontSize: "0.78rem", marginTop: "0.2rem" }}>
          /articles/{article.slug} · {dateStr}
        </p>
      </div>

      <span
        style={{
          padding: "0.25rem 0.75rem",
          borderRadius: "2rem",
          fontSize: "0.75rem",
          fontWeight: 700,
          backgroundColor: article.published
            ? "rgba(33, 115, 70, 0.25)"
            : "rgba(168, 144, 112, 0.15)",
          color: article.published ? "#40916c" : "#a89070",
          border: `1px solid ${article.published ? "rgba(64, 145, 108, 0.4)" : "rgba(168, 144, 112, 0.3)"}`,
          whiteSpace: "nowrap",
        }}
      >
        {article.published ? "Published" : "Draft"}
      </span>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Link
          href={`/admin/articles/${article.id}/edit`}
          style={{
            padding: "0.35rem 0.85rem",
            borderRadius: "0.35rem",
            border: "1px solid rgba(64, 145, 108, 0.4)",
            color: "#fff7ed",
            fontSize: "0.82rem",
            textDecoration: "none",
          }}
        >
          Edit
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            padding: "0.35rem 0.85rem",
            borderRadius: "0.35rem",
            border: "1px solid rgba(251, 191, 36, 0.3)",
            color: "#fbbf24",
            fontSize: "0.82rem",
            backgroundColor: "transparent",
            cursor: deleting ? "not-allowed" : "pointer",
            opacity: deleting ? 0.5 : 1,
          }}
        >
          {deleting ? "…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
