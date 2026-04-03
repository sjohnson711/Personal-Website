import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#F7F4EF" }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer
        style={{
          borderTop: "1px solid #E5DDD4",
          background: "#F0EBE2",
          padding: "2.5rem 1.5rem",
          marginTop: "5rem",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            <span
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 700,
                fontSize: "1rem",
                color: "#0F1B35",
                letterSpacing: "0.01em",
              }}
            >
              Seth Johnson
            </span>
            <span style={{ color: "#A8A29E", fontSize: "0.75rem" }}>
              Author · Software Engineer · Mental Health Therapist
            </span>
          </div>

          <span style={{ color: "#C4BAB0", fontSize: "0.78rem" }}>
            © {new Date().getFullYear()} Seth Johnson. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
