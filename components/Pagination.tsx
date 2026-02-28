import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  basePath = "/articles",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-2 mt-10"
    >
      {currentPage > 1 && (
        <Link
          href={`${basePath}?page=${currentPage - 1}`}
          style={{
            padding: "0.4rem 0.9rem",
            borderRadius: "0.4rem",
            backgroundColor: "rgba(27, 67, 50, 0.7)",
            color: "#fff7ed",
            textDecoration: "none",
            border: "1px solid rgba(64, 145, 108, 0.5)",
          }}
        >
          ← Prev
        </Link>
      )}

      {pages.map((page) => {
        const isActive = page === currentPage;
        return (
          <Link
            key={page}
            href={`${basePath}?page=${page}`}
            aria-current={isActive ? "page" : undefined}
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: "0.4rem",
              backgroundColor: isActive
                ? "#217346"
                : "rgba(27, 67, 50, 0.7)",
              color: "#fff7ed",
              fontWeight: isActive ? 700 : 400,
              textDecoration: "none",
              border: `1px solid ${isActive ? "#40916c" : "rgba(64, 145, 108, 0.5)"}`,
            }}
          >
            {page}
          </Link>
        );
      })}

      {currentPage < totalPages && (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          style={{
            padding: "0.4rem 0.9rem",
            borderRadius: "0.4rem",
            backgroundColor: "rgba(27, 67, 50, 0.7)",
            color: "#fff7ed",
            textDecoration: "none",
            border: "1px solid rgba(64, 145, 108, 0.5)",
          }}
        >
          Next →
        </Link>
      )}
    </nav>
  );
}
