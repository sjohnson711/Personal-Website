import { useEffect, useState } from "react";

interface Comment { id: number; name: string; body: string; createdAt: string; }
interface CommentSectionProps { articleId: number; }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function CommentSection({ articleId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/comments/${articleId}`)
      .then((r) => r.json())
      .then((d: { comments: Comment[] }) => setComments(d.comments ?? []))
      .catch(() => {});
  }, [articleId]);

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    const res = await fetch(`/api/comments/${articleId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), body: body.trim() }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({})) as { error?: string };
      setError(d.error ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    const c: Comment = await res.json();
    setComments((prev) => [...prev, c]);
    setName("");
    setBody("");
    setSuccess(true);
    setSubmitting(false);
  }

  return (
    <section className="card no-lift" style={{ padding: "2.75rem 3rem" }}>

      {/* Heading */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingBottom: "1.5rem", borderBottom: "1px solid #EAE4D8", marginBottom: "1.75rem" }}>
        <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: "1.2rem", fontWeight: 700, color: "#0F1B35", margin: 0 }}>
          Reader Messages
        </h2>
        {comments.length > 0 && (
          <span className="badge badge-published">{comments.length}</span>
        )}
      </div>

      {/* Comments list */}
      {comments.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2.5rem" }}>
          {comments.map((c) => (
            <div
              key={c.id}
              style={{
                padding: "1.1rem 1.35rem",
                borderRadius: "0.6rem",
                background: "#F7F4EF",
                border: "1px solid #EAE4D8",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem", marginBottom: "0.55rem", flexWrap: "wrap" }}>
                <span style={{ fontFamily: '"DM Sans", sans-serif', color: "#0F1B35", fontWeight: 700, fontSize: "0.88rem" }}>{c.name}</span>
                <time style={{ fontFamily: '"DM Sans", sans-serif', color: "#C4BAB0", fontSize: "0.72rem" }}>{formatDate(c.createdAt)}</time>
              </div>
              <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#4A4540", lineHeight: 1.75, fontSize: "0.92rem", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {c.body}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#C4BAB0", fontSize: "0.9rem", marginBottom: "2rem" }}>
          No messages yet — be the first to share your thoughts.
        </p>
      )}

      {/* Form */}
      <div style={{ borderTop: "1px solid #EAE4D8", paddingTop: "2rem" }}>
        <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, fontSize: "1rem", color: "#0F1B35", margin: "0 0 1.5rem" }}>
          Leave a Message
        </h3>

        {error && <div className="alert-error" style={{ marginBottom: "1.25rem" }}>{error}</div>}
        {success && <div className="alert-success" style={{ marginBottom: "1.25rem" }}>Your message has been posted. Thank you for reading!</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div>
            <label className="field-label">Your Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} placeholder="First name or handle" className="field-input" />
          </div>
          <div>
            <label className="field-label">Message</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={4} maxLength={2000} placeholder="What did you think of this post?" className="field-input" />
            <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#C4BAB0", fontSize: "0.7rem", marginTop: "0.3rem", textAlign: "right" }}>{body.length}/2000</p>
          </div>
          <div>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Posting…" : "Post Message"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
