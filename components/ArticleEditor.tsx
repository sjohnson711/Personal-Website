"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generateSlug } from "@/lib/slug";

interface ArticleEditorProps {
  mode: "new" | "edit";
  initialData?: {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    published: boolean;
  };
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.9rem",
  borderRadius: "0.5rem",
  border: "1px solid rgba(64, 145, 108, 0.5)",
  backgroundColor: "rgba(10, 5, 0, 0.5)",
  color: "#fff7ed",
  fontSize: "1rem",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#40916c",
  fontSize: "0.85rem",
  fontWeight: 600,
  marginBottom: "0.4rem",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

export default function ArticleEditor({ mode, initialData }: ArticleEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [published, setPublished] = useState(initialData?.published ?? false);
  // In edit mode the slug is already set; stop auto-generating so it isn't overwritten
  const [slugEdited, setSlugEdited] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Auto-generate slug from title until the user manually edits the slug field
  useEffect(() => {
    if (!slugEdited) {
      setSlug(generateSlug(title));
    }
  }, [title, slugEdited]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body = { title, slug, excerpt, content, published };

    const url =
      mode === "new"
        ? "/api/articles"
        : `/api/articles/${initialData!.id}`;
    const method = mode === "new" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setSaving(false);
      return;
    }

    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <p
          style={{
            color: "#fbbf24",
            backgroundColor: "rgba(251, 191, 36, 0.1)",
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid rgba(251, 191, 36, 0.3)",
          }}
        >
          {error}
        </p>
      )}

      <div>
        <label style={labelStyle}>Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Article title"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugEdited(true);
          }}
          required
          placeholder="article-slug"
          style={inputStyle}
        />
        <p style={{ color: "#a89070", fontSize: "0.78rem", marginTop: "0.3rem" }}>
          URL: /articles/{slug || "your-slug-here"}
        </p>
      </div>

      <div>
        <label style={labelStyle}>Excerpt</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          required
          rows={3}
          placeholder="A short summary shown on the articles list..."
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      <div>
        <label style={labelStyle}>Content (Markdown supported)</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={18}
          placeholder="Write your article here using Markdown..."
          style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", lineHeight: 1.6 }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <input
          type="checkbox"
          id="published"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          style={{ width: "1.1rem", height: "1.1rem", accentColor: "#217346" }}
        />
        <label
          htmlFor="published"
          style={{ color: "#fff7ed", cursor: "pointer" }}
        >
          Publish immediately
        </label>
      </div>

      <div style={{ display: "flex", gap: "1rem" }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "0.7rem 2rem",
            borderRadius: "0.5rem",
            backgroundColor: "#217346",
            color: "#fff7ed",
            fontWeight: 700,
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
            fontSize: "1rem",
          }}
        >
          {saving ? "Saving…" : mode === "new" ? "Publish Article" : "Save Changes"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/admin/dashboard")}
          style={{
            padding: "0.7rem 1.5rem",
            borderRadius: "0.5rem",
            backgroundColor: "transparent",
            color: "#a89070",
            fontWeight: 600,
            border: "1px solid rgba(168, 144, 112, 0.4)",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
