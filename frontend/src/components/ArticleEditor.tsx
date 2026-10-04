import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { generateSlug } from "../lib/slug";
import { api } from "../lib/api";
import { useIsMobile } from "../lib/useMediaQuery";
import { useImagePaste, MAX_ARTICLE_BYTES } from "../lib/imagePaste";

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
  const isMobile = useIsMobile();
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const { paste: handleContentPaste, pending } = useImagePaste(contentRef, content, setContent, setError);

  useEffect(() => { if (!slugEdited) setSlug(generateSlug(title)); }, [title, slugEdited]);

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (pending) { setError("Wait for the image to finish processing."); return; }
    if (new TextEncoder().encode(JSON.stringify({ title, slug, excerpt, content, published })).length > MAX_ARTICLE_BYTES) { setError("This article exceeds 8 MB. Remove an image or use HTTPS image links."); return; }
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
      {/* role="alert" — failed save needs an immediate announcement. */}
      {error && (
        <div className="alert-error" role="alert">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="article-title" className="field-label">Title</label>
        <input
          id="article-title"
          maxLength={300}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          aria-required="true"
          placeholder="Your article title"
          className="field-input"
          style={{ fontSize: isMobile ? "1rem" : "1.05rem", fontFamily: '"Playfair Display", Georgia, serif', color: "var(--color-navy)" }}
        />
      </div>

      <div>
        <label htmlFor="article-slug" className="field-label">URL Slug</label>
        <input
          id="article-slug"
          maxLength={160}
          type="text"
          value={slug}
          onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
          required
          aria-required="true"
          aria-describedby="article-slug-help"
          placeholder="url-friendly-slug"
          className="field-input"
        />
        <p id="article-slug-help" style={{ fontFamily: '"DM Sans", sans-serif', color: "var(--color-slate)", fontSize: "0.73rem", marginTop: "0.35rem" }}>
          Public URL: <span style={{ color: "var(--color-gold-ink)" }}>/articles/{slug || "your-slug"}</span>
        </p>
      </div>

      <div>
        <label htmlFor="article-excerpt" className="field-label">Excerpt</label>
        <textarea
          id="article-excerpt"
          maxLength={2000}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          required
          aria-required="true"
          rows={3}
          placeholder="A short summary shown on the articles list…"
          className="field-input"
        />
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "0.42rem" }}>
          <label htmlFor="article-content" className="field-label" style={{ marginBottom: 0 }}>Content</label>
          <span id="article-content-format" style={{ fontFamily: '"DM Sans", sans-serif', color: "var(--color-slate)", fontSize: "0.7rem" }}>Markdown supported · paste images or HTTPS image links at the cursor · 2 MB per image</span>
        </div>
        <textarea
          ref={contentRef}
          id="article-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onPaste={handleContentPaste}
          required
          aria-required="true"
          aria-describedby="article-content-format article-content-count"
          rows={isMobile ? 12 : 22}
          placeholder={"## Introduction\n\nWrite your article here…\n\n## Section Two\n\nSupports **bold**, *italic*, `code`, and [links](https://example.com)."}
          className="field-input"
          style={{ fontFamily: '"DM Mono", ui-monospace, monospace',
                   fontSize: isMobile ? "0.85rem" : "0.87rem",
                   lineHeight: 1.65 }}
        />
        <p id="article-content-count" style={{ fontFamily: '"DM Sans", sans-serif', color: "var(--color-slate)", fontSize: "0.7rem", marginTop: "0.35rem", textAlign: "right" }}>
          {pending > 0 ? `Processing ${pending} image(s)… ` : ""}{content.length.toLocaleString()} characters · Edit ![description] for image alt text
        </p>
      </div>

      {/* Publish toggle. Explicit htmlFor + id pair (instead of relying on the
          implicit <label> wrapper) so SRs reliably announce the description. */}
      <label
        htmlFor="article-published"
        style={{
          display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer",
          padding: "1rem 1.25rem", borderRadius: "0.55rem",
          background: published ? "rgba(184,150,46,0.05)" : "#FAFAF9",
          border: `1px solid ${published ? "rgba(184,150,46,0.35)" : "#E5DDD4"}`,
          transition: "border-color 0.2s, background 0.2s",
        }}
      >
        <input
          id="article-published"
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          aria-describedby="article-published-help"
          style={{ width: "1.1rem", height: "1.1rem", accentColor: "var(--color-gold-ink)", cursor: "pointer", flexShrink: 0 }}
        />
        <div>
          <p style={{ fontFamily: '"DM Sans", sans-serif', color: published ? "#7A5C10" : "#1C1917", fontWeight: 600, fontSize: "0.92rem", margin: 0 }}>
            {published ? "Published — visible to all readers" : "Save as Draft"}
          </p>
          <p id="article-published-help" style={{ fontFamily: '"DM Sans", sans-serif', color: "var(--color-slate)", fontSize: "0.76rem", margin: "0.15rem 0 0" }}>
            {published ? "Uncheck to revert to draft at any time." : "Check to make this article live on your site."}
          </p>
        </div>
      </label>

      <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.25rem", flexWrap: "wrap" }}>
        <button type="submit" disabled={saving || pending > 0} className="btn-primary"
                style={isMobile ? { flex: 1 } : undefined}>
          {saving ? "Saving…" : mode === "new" ? "Publish Article" : "Save Changes"}
        </button>
        <button type="button" onClick={() => navigate("/admin/dashboard")} className="btn-ghost"
                style={isMobile ? { flex: 1 } : undefined}>
          Cancel
        </button>
      </div>
    </form>
  );
}
