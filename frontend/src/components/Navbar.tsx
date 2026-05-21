import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useIsMobile } from "../lib/useMediaQuery";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/articles", label: "Articles" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { email, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate("/");
  }

  // Close panel on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close panel when switching back to desktop
  useEffect(() => {
    if (!isMobile) setMenuOpen(false);
  }, [isMobile]);

  // Click-outside to close
  useEffect(() => {
    if (!menuOpen) return;
    function handler(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const linkColor = (active: boolean) => (active ? "#0F1B35" : "#6B6560");
  const isAdminActive = pathname.startsWith("/admin");

  return (
    <nav
      ref={navRef}
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
          padding: isMobile ? "0 1rem" : "0 1.5rem",
          height: "64px",
          display: "flex",
          alignItems: "center",
          gap: isMobile ? "0.75rem" : "2rem",
        }}
      >
        {/* Brand */}
        <Link
          to="/"
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: isMobile ? "1rem" : "1.1rem",
            fontWeight: 700,
            color: "#0F1B35",
            textDecoration: "none",
            letterSpacing: "0.02em",
            flexShrink: 0,
            flex: isMobile ? 1 : "0 0 auto",
          }}
        >
          Seth Johnson
        </Link>

        {/* Desktop nav links + auth */}
        {!isMobile && (
          <>
            <span
              style={{
                width: "1px",
                height: "20px",
                background: "#E5DDD4",
                flexShrink: 0,
              }}
            />

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
                      color: linkColor(active),
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
                    fontWeight: isAdminActive ? 600 : 400,
                    color: linkColor(isAdminActive),
                    borderBottom: isAdminActive ? "2px solid #B8962E" : "2px solid transparent",
                    textDecoration: "none",
                    letterSpacing: "0.01em",
                    transition: "color 0.15s",
                  }}
                >
                  Dashboard
                </Link>
              )}
            </div>

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
          </>
        )}

        {/* Mobile hamburger */}
        {isMobile && (
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-panel"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            style={{
              width: "44px",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "1px solid transparent",
              borderRadius: "0.4rem",
              color: "#0F1B35",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        )}
      </div>

      {/* Mobile slide-down panel */}
      {isMobile && (
        <div
          id="mobile-nav-panel"
          style={{
            overflow: "hidden",
            maxHeight: menuOpen ? "420px" : "0",
            opacity: menuOpen ? 1 : 0,
            transition: "max-height 0.22s ease, opacity 0.18s ease",
            background: "rgba(247, 244, 239, 0.98)",
            borderBottom: menuOpen ? "1px solid #E5DDD4" : "1px solid transparent",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "0.5rem 1rem 1rem",
            }}
          >
            {publicLinks.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  to={href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    minHeight: "48px",
                    padding: "0 0.5rem",
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: "1rem",
                    fontWeight: active ? 600 : 500,
                    color: linkColor(active),
                    borderLeft: active ? "3px solid #B8962E" : "3px solid transparent",
                    paddingLeft: active ? "0.85rem" : "1rem",
                    textDecoration: "none",
                    letterSpacing: "0.01em",
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
                  minHeight: "48px",
                  padding: "0 0.5rem",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: "1rem",
                  fontWeight: isAdminActive ? 600 : 500,
                  color: linkColor(isAdminActive),
                  borderLeft: isAdminActive ? "3px solid #B8962E" : "3px solid transparent",
                  paddingLeft: isAdminActive ? "0.85rem" : "1rem",
                  textDecoration: "none",
                  letterSpacing: "0.01em",
                }}
              >
                Dashboard
              </Link>
            )}

            <div
              style={{
                marginTop: "0.75rem",
                paddingTop: "0.75rem",
                borderTop: "1px solid #E5DDD4",
              }}
            >
              {email ? (
                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    minHeight: "48px",
                    padding: "0.6rem 1rem",
                    borderRadius: "0.4rem",
                    border: "1px solid #D8D0C4",
                    background: "transparent",
                    color: "#6B6560",
                    fontFamily: '"DM Sans", sans-serif',
                    fontWeight: 500,
                    fontSize: "0.95rem",
                    cursor: "pointer",
                  }}
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  to="/gateway"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    minHeight: "48px",
                    padding: "0.6rem 1rem",
                    borderRadius: "0.4rem",
                    border: "1px solid rgba(184,150,46,0.4)",
                    color: "#7A5C10",
                    fontFamily: '"DM Sans", sans-serif',
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    textDecoration: "none",
                  }}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
