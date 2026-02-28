import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { marked } from "marked";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.article.findUnique({
    where: { slug },
    select: { title: true, excerpt: true },
  });

  if (!article) return { title: "Article Not Found" };

  return {
    title: `${article.title} — [Author Name]`,
    description: article.excerpt,
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;

  const article = await prisma.article.findUnique({
    where: { slug, published: true },
  });

  if (!article) notFound();

  const htmlContent = await marked(article.content);

  const formattedDate = new Date(article.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 flex flex-col gap-8">
      <Link
        href="/articles"
        style={{
          color: "#40916c",
          textDecoration: "none",
          fontSize: "0.9rem",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
        }}
      >
        ← Back to Articles
      </Link>

      <article className="glass-card p-8 flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <time
            dateTime={new Date(article.createdAt).toISOString()}
            style={{ color: "#40916c", fontSize: "0.85rem", letterSpacing: "0.04em" }}
          >
            {formattedDate}
          </time>
          <h1
            className="font-serif text-3xl font-bold leading-snug"
            style={{ color: "#fbbf24" }}
          >
            {article.title}
          </h1>
          <p
            style={{
              color: "#a89070",
              fontStyle: "italic",
              lineHeight: 1.7,
              paddingBottom: "1rem",
              borderBottom: "1px solid rgba(64, 145, 108, 0.25)",
            }}
          >
            {article.excerpt}
          </p>
        </header>

        <div
          className="prose-sunset"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </article>
    </div>
  );
}
