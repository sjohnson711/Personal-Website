import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useIsMobile } from "../lib/useMediaQuery";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const isMobile = useIsMobile();

  // Allow keyboard users to dismiss the modal with the Escape key, per the
  // WAI-ARIA Authoring Practices "dialog" pattern.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      await api.post("/contact", { name, email, message });
      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
      setTimeout(() => {
        onClose();
        setStatus("idle");
      }, 2000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Network error — please try again."
      );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop. aria-hidden so screen readers ignore it — the dialog itself
          is the focusable region. */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 999,
        }}
      />

      {/* Modal. role="dialog" + aria-modal tells assistive tech this is a
          modal dialog. aria-labelledby points at the heading so screen readers
          announce the dialog's purpose on open. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-heading"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "#FFFFFF",
          border: "1px solid #EAE4D8",
          borderRadius: "0.75rem",
          padding: isMobile ? "1.5rem 1.25rem" : "2.5rem",
          maxWidth: "500px",
          width: isMobile ? "calc(100vw - 1.5rem)" : "90%",
          maxHeight: "90vh",
          overflowY: "auto",
          zIndex: 1000,
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
        }}
      >
        {/* Close button. aria-label gives the icon-only button an accessible
            name (otherwise SRs read the literal "✕" glyph as "cross mark"). */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close contact form"
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "transparent",
            border: "none",
            fontSize: "1.5rem",
            cursor: "pointer",
            color: "#A8A29E",
          }}
        >
          <span aria-hidden="true">✕</span>
        </button>

        <h2
          id="contact-modal-heading"
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: isMobile ? "1.3rem" : "1.65rem",
            fontWeight: 700,
            color: "#0F1B35",
            margin: "0 0 0.5rem",
          }}
        >
          Get in Touch
        </h2>
        <p
          style={{
            fontFamily: '"DM Sans", sans-serif',
            color: "#6B6560",
            fontSize: isMobile ? "0.88rem" : "0.95rem",
            margin: isMobile ? "0 0 1.25rem" : "0 0 2rem",
          }}
        >
          Send me a message and I'll get back to you soon.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Name */}
          <div>
            <label
              htmlFor="contact-name"
              style={{
                display: "block",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#B8962E",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "0.5rem",
              }}
            >
              Name
            </label>
            <input
              id="contact-name"
              type="text"
              required
              aria-required="true"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                padding: isMobile ? "0.65rem 0.85rem" : "0.75rem 1rem",
                border: "1px solid #D8D0C4",
                borderRadius: "0.5rem",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: isMobile ? "16px" : "0.95rem",
                color: "#1C1917",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#B8962E")}
              onBlur={(e) => (e.target.style.borderColor = "#D8D0C4")}
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="contact-email"
              style={{
                display: "block",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#B8962E",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "0.5rem",
              }}
            >
              Email
            </label>
            <input
              id="contact-email"
              type="email"
              required
              aria-required="true"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: isMobile ? "0.65rem 0.85rem" : "0.75rem 1rem",
                border: "1px solid #D8D0C4",
                borderRadius: "0.5rem",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: isMobile ? "16px" : "0.95rem",
                color: "#1C1917",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#B8962E")}
              onBlur={(e) => (e.target.style.borderColor = "#D8D0C4")}
            />
          </div>

          {/* Message */}
          <div>
            <label
              htmlFor="contact-message"
              style={{
                display: "block",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#B8962E",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "0.5rem",
              }}
            >
              Message
            </label>
            <textarea
              id="contact-message"
              required
              aria-required="true"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={isMobile ? 3 : 5}
              style={{
                width: "100%",
                padding: isMobile ? "0.65rem 0.85rem" : "0.75rem 1rem",
                border: "1px solid #D8D0C4",
                borderRadius: "0.5rem",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: isMobile ? "16px" : "0.95rem",
                color: "#1C1917",
                outline: "none",
                transition: "border-color 0.15s",
                resize: "vertical",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#B8962E")}
              onBlur={(e) => (e.target.style.borderColor = "#D8D0C4")}
            />
          </div>

          {/* Error message — role="alert" forces an immediate announcement
              on render so the user knows the submission failed. */}
          {status === "error" && (
            <p
              role="alert"
              style={{
                color: "#9C3328",
                fontSize: "0.9rem",
                margin: 0,
                padding: "0.75rem 1rem",
                background: "#FEF2F0",
                borderRadius: "0.5rem",
                border: "1px solid rgba(156, 51, 40, 0.25)",
              }}
            >
              {errorMsg}
            </p>
          )}

          {/* Success message — polite live region announces without
              interrupting. The ✓ glyph is hidden from screen readers because
              the text already conveys success. */}
          {status === "success" && (
            <p
              role="status"
              aria-live="polite"
              style={{
                color: "#40916C",
                fontSize: "0.9rem",
                margin: 0,
                padding: "0.75rem 1rem",
                background: "#F0FDF4",
                borderRadius: "0.5rem",
                border: "1px solid rgba(64, 145, 108, 0.3)",
              }}
            >
              <span aria-hidden="true">✓ </span>Message sent! I'll get back to you soon.
            </p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            style={{
              padding: "0.85rem 1.75rem",
              borderRadius: "0.5rem",
              background: status === "success" ? "#40916C" : "#0F1B35",
              color: "#FFF7ED",
              border: "none",
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 600,
              fontSize: "0.95rem",
              cursor: status === "loading" || status === "success" ? "default" : "pointer",
              transition: "all 0.15s",
              opacity: status === "loading" || status === "success" ? 0.8 : 1,
            }}
          >
            {status === "loading" ? "Sending…" : status === "success" ? "✓ Sent" : "Send Message"}
          </button>
        </form>
      </div>
    </>
  );
}
