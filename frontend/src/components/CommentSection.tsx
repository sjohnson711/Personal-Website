import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useIsMobile } from "../lib/useMediaQuery";

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
  const isMobile = useIsMobile();

  useEffect(() => {
    api
      .get(`/comments/${articleId}`)
      .then((d: { comments: Comment[] }) => setComments(d.comments ?? []))
      .catch(() => {});
  }, [articleId]);

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const c: Comment = await api.post(`/comments/${articleId}`, {
        name: name.trim(),
        body: body.trim(),
      });
      setComments((prev) => [...prev, c]);
      setName("");
      setBody("");
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card no-lift" style={{ padding: isMobile ? "1.75rem 1.25rem" : "2.75rem 3rem" }}>

      {/* Heading */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingBottom: "1.5rem", borderBottom: "1px solid #EAE4D8", marginBottom: "1.75rem" }}>
        <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif',
                     fontSize: isMobile ? "1.05rem" : "1.2rem",
                     fontWeight: 700, color: "#0F1B35", margin: 0 }}>
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
                padding: isMobile ? "0.9rem 1rem" : "1.1rem 1.35rem",
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

        {/* role="alert" on the error makes screen readers announce it immediately
            on render. The success message uses role="status" / aria-live="polite"
            so it doesn't interrupt the user mid-action. */}
        {error && (
          <div className="alert-error" role="alert" style={{ marginBottom: "1.25rem" }}>
            {error}
          </div>
        )}
        {success && (
          <div className="alert-success" role="status" aria-live="polite" style={{ marginBottom: "1.25rem" }}>
            Your message has been posted. Thank you for reading!
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div>
            <label htmlFor="comment-name" className="field-label">Your Name</label>
            <input
              id="comment-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              aria-required="true"
              maxLength={100}
              placeholder="First name or handle"
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="comment-body" className="field-label">Message</label>
            <textarea
              id="comment-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              aria-required="true"
              aria-describedby="comment-body-count"
              rows={4}
              maxLength={2000}
              placeholder="What did you think of this post?"
              className="field-input"
            />
            {/* aria-live="polite" so screen readers periodically hear the count
                as the user types — but aria-describedby above already links it
                to the textarea so it's read on focus too. */}
            <p
              id="comment-body-count"
              aria-live="polite"
              style={{ fontFamily: '"DM Sans", sans-serif', color: "#C4BAB0", fontSize: "0.7rem", marginTop: "0.3rem", textAlign: "right" }}
            >
              <span className="sr-only">Characters used: </span>{body.length}/2000
            </p>
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
