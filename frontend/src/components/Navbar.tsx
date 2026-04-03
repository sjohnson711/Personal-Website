import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/articles", label: "Articles" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { email, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(247, 244, 239, 0.96)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid #E5DDD4",
        boxShadow: "0 1px 0 rgba(28,25,23,0.05)",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 1.5rem",
          height: "64px",
          display: "flex",
          alignItems: "center",
          gap: "2rem",
        }}
      >
        {/* Brand */}
        <Link
          to="/"
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "#0F1B35",
            textDecoration: "none",
            letterSpacing: "0.02em",
            flexShrink: 0,
          }}
        >
          Seth Johnson
        </Link>

        {/* Thin gold separator */}
        <span style={{ width: "1px", height: "20px", background: "#E5DDD4", flexShrink: 0 }} />

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "stretch", height: "100%", flex: 1 }}>
          {publicLinks.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                to={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0 1rem",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: "0.88rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? "#0F1B35" : "#6B6560",
                  borderBottom: active ? "2px solid #B8962E" : "2px solid transparent",
                  textDecoration: "none",
                  letterSpacing: "0.01em",
                  transition: "color 0.15s",
                }}
              >
                {label}
              </Link>
            );
          })}

          {email && (
            <Link
              to="/admin/dashboard"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0 1rem",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: "0.88rem",
                fontWeight: pathname.startsWith("/admin") ? 600 : 400,
                color: pathname.startsWith("/admin") ? "#0F1B35" : "#6B6560",
                borderBottom: pathname.startsWith("/admin") ? "2px solid #B8962E" : "2px solid transparent",
                textDecoration: "none",
                letterSpacing: "0.01em",
                transition: "color 0.15s",
              }}
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Auth */}
        {email ? (
          <button
            onClick={handleLogout}
            style={{
              padding: "0.42rem 1.1rem",
              borderRadius: "0.4rem",
              border: "1px solid #D8D0C4",
              background: "transparent",
              color: "#6B6560",
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 500,
              fontSize: "0.83rem",
              cursor: "pointer",
              transition: "border-color 0.15s, color 0.15s",
            }}
          >
            Sign Out
          </button>
        ) : (
          <Link
            to="/gateway"
            style={{
              padding: "0.42rem 1.1rem",
              borderRadius: "0.4rem",
              border: "1px solid rgba(184,150,46,0.4)",
              color: "#7A5C10",
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 600,
              fontSize: "0.83rem",
              textDecoration: "none",
              transition: "border-color 0.15s",
            }}
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
