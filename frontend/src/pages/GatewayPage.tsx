import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function GatewayPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const ok = await login(email, password);
    setLoading(false);
    if (ok) { navigate("/admin/dashboard"); }
    else { setError("Invalid email or password."); }
  }

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem", background: "#F7F4EF" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>

        {/* Brand mark */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: "1.4rem", fontWeight: 700, color: "#0F1B35", margin: "0 0 0.4rem", letterSpacing: "-0.01em" }}>
            Seth Johnson
          </h1>
          <div style={{ width: "32px", height: "2px", background: "linear-gradient(90deg, #B8962E, rgba(184,150,46,0.3))", borderRadius: "1px", margin: "0 auto" }} />
        </div>

        <div className="card no-lift" style={{ padding: "2.75rem 2.5rem" }}>
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: "1.5rem", fontWeight: 700, color: "#0F1B35", margin: "0 0 0.35rem" }}>Admin Sign In</h2>
            <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#A8A29E", fontSize: "0.83rem", margin: 0 }}>Author access only.</p>
          </div>

          {error && <div className="alert-error" style={{ marginBottom: "1.5rem" }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label className="field-label">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="admin@yoursite.com" className="field-input" />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••••" className="field-input" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "0.25rem", padding: "0.8rem" }}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontFamily: '"DM Sans", sans-serif', color: "#C4BAB0", fontSize: "0.72rem", marginTop: "1.5rem" }}>
          This page is not publicly linked.
        </p>
      </div>
    </div>
  );
}
