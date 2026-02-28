import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ArticleCard from "@/components/ArticleCard";

async function getLatestArticles() {
  return prisma.article.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { title: true, slug: true, excerpt: true, createdAt: true },
  });
}

export default async function HomePage() {
  const latest = await getLatestArticles();

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 flex flex-col gap-20">
      {/* Hero */}
      <section className="flex flex-col items-center text-center gap-8">
        <div
          className="glass-card px-8 py-12 flex flex-col items-center gap-6"
          style={{ maxWidth: "680px", width: "100%" }}
        >
          {/* Book cover placeholder */}
          <div
            style={{
              width: "160px",
              height: "220px",
              backgroundColor: "rgba(33, 115, 70, 0.25)",
              border: "2px dashed rgba(64, 145, 108, 0.5)",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#40916c",
              fontSize: "0.8rem",
              letterSpacing: "0.05em",
            }}
          >
            BOOK COVER
          </div>

          <h1
            className="font-serif text-4xl font-bold leading-tight"
            style={{ color: "#fbbf24" }}
          >
            [Book Title]
          </h1>

          <p
            style={{
              color: "#fff7ed",
              fontSize: "1.1rem",
              lineHeight: 1.75,
              maxWidth: "520px",
            }}
          >
            [A compelling one-to-two sentence description of the book that draws
            readers in and makes them want to learn more. Replace this with your
            real synopsis.]
          </p>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            <a
              href="#"
              style={{
                padding: "0.75rem 2rem",
                borderRadius: "0.5rem",
                backgroundColor: "#217346",
                color: "#fff7ed",
                fontWeight: 700,
                textDecoration: "none",
                fontSize: "1rem",
              }}
            >
              Pre-order Now
            </a>
            <Link
              href="/about"
              style={{
                padding: "0.75rem 2rem",
                borderRadius: "0.5rem",
                border: "1px solid rgba(64, 145, 108, 0.6)",
                color: "#fff7ed",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: "1rem",
              }}
            >
              About the Author
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      {latest.length > 0 && (
        <section className="flex flex-col gap-6">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h2
              className="font-serif text-2xl font-bold"
              style={{ color: "#fbbf24" }}
            >
              Latest Articles
            </h2>
            <Link
              href="/articles"
              style={{ color: "#40916c", fontSize: "0.9rem", textDecoration: "none" }}
            >
              View all →
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {latest.map((article) => (
              <ArticleCard key={article.slug} {...article} />
            ))}
          </div>
        </section>
      )}

      {/* Newsletter placeholder */}
      <section className="glass-card p-10 text-center flex flex-col items-center gap-4">
        <h2 className="font-serif text-2xl font-bold" style={{ color: "#fbbf24" }}>
          Stay in the Loop
        </h2>
        <p style={{ color: "#fff7ed", maxWidth: "440px" }}>
          Get new articles delivered to your inbox every week. No spam, ever.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
          <input
            type="email"
            placeholder="your@email.com"
            style={{
              padding: "0.65rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid rgba(64, 145, 108, 0.5)",
              backgroundColor: "rgba(10, 5, 0, 0.5)",
              color: "#fff7ed",
              fontSize: "1rem",
              minWidth: "240px",
            }}
          />
          <button
            style={{
              padding: "0.65rem 1.5rem",
              borderRadius: "0.5rem",
              backgroundColor: "#217346",
              color: "#fff7ed",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Subscribe
          </button>
        </div>
      </section>
    </div>
  );
}
