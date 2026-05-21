import { Link } from "react-router-dom";
import { useIsMobile } from "../lib/useMediaQuery";

interface PaginationProps { currentPage: number; totalPages: number; basePath?: string; }

export default function Pagination({ currentPage, totalPages, basePath = "/articles" }: PaginationProps) {
  const isMobile = useIsMobile();
  if (totalPages <= 1) return null;

  const base: React.CSSProperties = {
    padding: isMobile ? "0.5rem 0.75rem" : "0.48rem 1rem",
    minHeight: "40px",
    minWidth: isMobile ? "40px" : "auto",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "0.42rem",
    fontFamily: '"DM Sans", sans-serif',
    color: "#6B6560",
    textDecoration: "none",
    fontSize: isMobile ? "0.82rem" : "0.85rem",
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

  // On mobile, collapse to a compact window centered on currentPage when totalPages is large.
  // Show first, last, neighbors of current, and ellipses.
  const pagesToShow: (number | "…")[] = (() => {
    if (!isMobile || totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const set = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
    const sorted = [...set].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
    const out: (number | "…")[] = [];
    for (let i = 0; i < sorted.length; i++) {
      out.push(sorted[i]);
      if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) out.push("…");
    }
    return out;
  })();

  const ellipsisStyle: React.CSSProperties = {
    ...base,
    background: "transparent",
    border: "1px solid transparent",
    boxShadow: "none",
    cursor: "default",
    minWidth: "24px",
    padding: "0.5rem 0.25rem",
  };

  return (
    <nav
      aria-label="Pagination"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: isMobile ? "0.35rem" : "0.45rem",
        flexWrap: "wrap",
      }}
    >
      {currentPage > 1 && (
        <Link to={`${basePath}?page=${currentPage - 1}`} style={base}>
          {isMobile ? "←" : "← Prev"}
        </Link>
      )}
      {pagesToShow.map((p, idx) =>
        p === "…" ? (
          <span key={`ellipsis-${idx}`} aria-hidden="true" style={ellipsisStyle}>…</span>
        ) : (
          <Link
            key={p}
            to={`${basePath}?page=${p}`}
            aria-current={p === currentPage ? "page" : undefined}
            style={p === currentPage ? active : base}
          >
            {p}
          </Link>
        ),
      )}
      {currentPage < totalPages && (
        <Link to={`${basePath}?page=${currentPage + 1}`} style={base}>
          {isMobile ? "→" : "Next →"}
        </Link>
      )}
    </nav>
  );
}
