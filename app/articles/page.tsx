import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ArticleCard from "@/components/ArticleCard";
import Pagination from "@/components/Pagination";
import { getPaginationParams, getTotalPages } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Articles — [Book Title]",
  description: "Weekly articles by [Author Name] on [topic].",
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { page, skip, take } = getPaginationParams(params);

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: { title: true, slug: true, excerpt: true, createdAt: true },
    }),
    prisma.article.count({ where: { published: true } }),
  ]);

  const totalPages = getTotalPages(total);

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 flex flex-col gap-10">
      <header>
        <h1
          className="font-serif text-4xl font-bold"
          style={{ color: "#fbbf24" }}
        >
          Articles
        </h1>
        <div
          style={{
            width: "60px",
            height: "4px",
            backgroundColor: "#217346",
            borderRadius: "2px",
            marginTop: "0.75rem",
          }}
        />
        {total > 0 && (
          <p style={{ color: "#a89070", marginTop: "0.75rem", fontSize: "0.9rem" }}>
            {total} article{total !== 1 ? "s" : ""} — page {page} of {totalPages}
          </p>
        )}
      </header>

      {articles.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p style={{ color: "#a89070", fontSize: "1.1rem" }}>
            No articles yet — check back soon.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.slug} {...article} />
          ))}
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  );
}
