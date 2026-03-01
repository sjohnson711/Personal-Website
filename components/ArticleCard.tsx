import Link from "next/link";

interface ArticleCardProps {
  title: string;
  slug: string;
  excerpt: string;
  createdAt: string | Date;
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ArticleCard({
  title,
  slug,
  excerpt,
  createdAt,
}: ArticleCardProps) {
  return (
    <article className="glass-card p-6 flex flex-col gap-3">
      <time
        dateTime={new Date(createdAt).toISOString()}
        style={{ color: "#40916c", fontSize: "0.8rem", letterSpacing: "0.05em" }}
      >
        {formatDate(createdAt)}
      </time>

      <h2
        className="font-serif text-xl font-bold leading-snug"
        style={{ color: "#e8d5b0" }}
      >
        <Link
          href={`/articles/${slug}`}
          style={{ color: "inherit", textDecoration: "none" }}
          className="hover:underline"
        >
          {title}
        </Link>
      </h2>

      <p style={{ color: "#fff7ed", lineHeight: 1.7, fontSize: "0.95rem" }}>
        {excerpt}
      </p>

      <Link
        href={`/articles/${slug}`}
        style={{
          color: "#40916c",
          fontWeight: 600,
          fontSize: "0.9rem",
          marginTop: "auto",
          textDecoration: "none",
        }}
        className="hover:underline"
      >
        Read more →
      </Link>
    </article>
  );
}
