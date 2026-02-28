"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function GatewayPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid credentials.");
    } else {
      router.push("/admin/dashboard");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.7rem 1rem",
    borderRadius: "0.5rem",
    border: "1px solid rgba(64, 145, 108, 0.5)",
    backgroundColor: "rgba(10, 5, 0, 0.5)",
    color: "#fff7ed",
    fontSize: "1rem",
    outline: "none",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 64px)",
        padding: "2rem",
      }}
    >
      <div className="glass-card p-10 w-full" style={{ maxWidth: "420px" }}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1
              className="font-serif text-2xl font-bold"
              style={{ color: "#fbbf24" }}
            >
              Sign In
            </h1>
            <p style={{ color: "#a89070", fontSize: "0.85rem" }}>
              Author access only.
            </p>
          </div>

          {error && (
            <p
              style={{
                color: "#fbbf24",
                fontSize: "0.9rem",
                backgroundColor: "rgba(251, 191, 36, 0.1)",
                padding: "0.65rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid rgba(251, 191, 36, 0.3)",
              }}
            >
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              style={{
                color: "#40916c",
                fontSize: "0.8rem",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={inputStyle}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              style={{
                color: "#40916c",
                fontSize: "0.8rem",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.75rem",
              borderRadius: "0.5rem",
              backgroundColor: "#217346",
              color: "#fff7ed",
              fontWeight: 700,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontSize: "1rem",
            }}
          >
            {loading ? "Signing in…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
