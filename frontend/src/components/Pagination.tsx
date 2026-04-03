import { Link } from "react-router-dom";

interface PaginationProps { currentPage: number; totalPages: number; basePath?: string; }

export default function Pagination({ currentPage, totalPages, basePath = "/articles" }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const base: React.CSSProperties = {
    padding: "0.48rem 1rem",
    borderRadius: "0.42rem",
    fontFamily: '"DM Sans", sans-serif',
    color: "#6B6560",
    textDecoration: "none",
    fontSize: "0.85rem",
    fontWeight: 500,
    border: "1px solid #E5DDD4",
    background: "#FFFFFF",
    boxShadow: "0 1px 3px rgba(28,25,23,0.04)",
    transition: "border-color 0.15s",
  };

  const active: React.CSSProperties = {
    ...base,
    background: "#0F1B35",
    border: "1px solid #0F1B35",
    color: "#F7F4EF",
    fontWeight: 700,
    boxShadow: "0 2px 8px rgba(15,27,53,0.18)",
  };

  return (
    <nav aria-label="Pagination" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem" }}>
      {currentPage > 1 && <Link to={`${basePath}?page=${currentPage - 1}`} style={base}>← Prev</Link>}
      {pages.map((p) => (
        <Link key={p} to={`${basePath}?page=${p}`} aria-current={p === currentPage ? "page" : undefined} style={p === currentPage ? active : base}>
          {p}
        </Link>
      ))}
      {currentPage < totalPages && <Link to={`${basePath}?page=${currentPage + 1}`} style={base}>Next →</Link>}
    </nav>
  );
}
