import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateSlug } from "../lib/slug";
import { api } from "../lib/api";

interface ArticleEditorProps {
  mode: "new" | "edit";
  initialData?: { id: number; title: string; slug: string; excerpt: string; content: string; published: boolean; };
}

export default function ArticleEditor({ mode, initialData }: ArticleEditorProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [published, setPublished] = useState(initialData?.published ?? false);
  const [slugEdited, setSlugEdited] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (!slugEdited) setSlug(generateSlug(title)); }, [title, slugEdited]);

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (mode === "new") {
        await api.post("/articles", {
          title,
          slug,
          excerpt,
          content,
          published,
        });
      } else {
        await api.put(`/articles/${initialData!.id}`, {
          title,
          slug,
          excerpt,
          content,
          published,
        });
      }
      navigate("/admin/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {error && <div className="alert-error">{error}</div>}

      <div>
        <label className="field-label">Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Your article title" className="field-input" style={{ fontSize: "1.05rem", fontFamily: '"Playfair Display", Georgia, serif', color: "#0F1B35" }} />
      </div>

      <div>
        <label className="field-label">URL Slug</label>
        <input type="text" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }} required placeholder="url-friendly-slug" className="field-input" />
        <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#C4BAB0", fontSize: "0.73rem", marginTop: "0.35rem" }}>
          Public URL: <span style={{ color: "#B8962E" }}>/articles/{slug || "your-slug"}</span>
        </p>
      </div>

      <div>
        <label className="field-label">Excerpt</label>
        <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} required rows={3} placeholder="A short summary shown on the articles list…" className="field-input" />
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "0.42rem" }}>
          <label className="field-label" style={{ marginBottom: 0 }}>Content</label>
          <span style={{ fontFamily: '"DM Sans", sans-serif', color: "#C4BAB0", fontSize: "0.7rem" }}>Markdown supported</span>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={22}
          placeholder={"## Introduction\n\nWrite your article here…\n\n## Section Two\n\nSupports **bold**, *italic*, `code`, and [links](https://example.com)."}
          className="field-input"
          style={{ fontFamily: '"DM Mono", ui-monospace, monospace', fontSize: "0.87rem", lineHeight: 1.65 }}
        />
        <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#C4BAB0", fontSize: "0.7rem", marginTop: "0.35rem", textAlign: "right" }}>
          {content.length.toLocaleString()} characters
        </p>
      </div>

      {/* Publish toggle */}
      <label
        style={{
          display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer",
          padding: "1rem 1.25rem", borderRadius: "0.55rem",
          background: published ? "rgba(184,150,46,0.05)" : "#FAFAF9",
          border: `1px solid ${published ? "rgba(184,150,46,0.35)" : "#E5DDD4"}`,
          transition: "border-color 0.2s, background 0.2s",
        }}
      >
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} style={{ width: "1.1rem", height: "1.1rem", accentColor: "#B8962E", cursor: "pointer", flexShrink: 0 }} />
        <div>
          <p style={{ fontFamily: '"DM Sans", sans-serif', color: published ? "#7A5C10" : "#1C1917", fontWeight: 600, fontSize: "0.92rem", margin: 0 }}>
            {published ? "Published — visible to all readers" : "Save as Draft"}
          </p>
          <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#A8A29E", fontSize: "0.76rem", margin: "0.15rem 0 0" }}>
            {published ? "Uncheck to revert to draft at any time." : "Check to make this article live on your site."}
          </p>
        </div>
      </label>

      <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.25rem" }}>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : mode === "new" ? "Publish Article" : "Save Changes"}
        </button>
        <button type="button" onClick={() => navigate("/admin/dashboard")} className="btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  );
}
