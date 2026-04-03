import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem", background: "#F7F4EF" }}>
      <div className="card no-lift fade-up" style={{ padding: "4.5rem 3.5rem", maxWidth: "440px", width: "100%", textAlign: "center" }}>
        <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: "5.5rem", fontWeight: 900, color: "#EAE4D8", lineHeight: 1, margin: "0 0 0.5rem", letterSpacing: "-0.04em" }}>
          404
        </p>
        <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: "1.5rem", fontWeight: 700, color: "#0F1B35", margin: "0 0 0.65rem" }}>
          Page Not Found
        </h1>
        <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#A8A29E", lineHeight: 1.65, margin: "0 0 2.25rem", fontSize: "0.95rem" }}>
          This page doesn't exist or may have been moved.
        </p>
        <Link to="/" className="btn-primary" style={{ justifyContent: "center", width: "100%" }}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
