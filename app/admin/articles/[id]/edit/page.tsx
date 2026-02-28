import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ArticleEditor from "@/components/ArticleEditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditArticlePage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/gateway");

  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) notFound();

  const article = await prisma.article.findUnique({ where: { id: numericId } });
  if (!article) notFound();

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col gap-8">
      <header>
        <h1 className="font-serif text-3xl font-bold" style={{ color: "#fbbf24" }}>
          Edit Article
        </h1>
        <div
          style={{
            width: "48px",
            height: "4px",
            backgroundColor: "#217346",
            borderRadius: "2px",
            marginTop: "0.6rem",
          }}
        />
        <p style={{ color: "#a89070", marginTop: "0.5rem", fontSize: "0.88rem" }}>
          {article.title}
        </p>
      </header>

      <div className="glass-card p-8">
        <ArticleEditor
          mode="edit"
          initialData={{
            id: article.id,
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt,
            content: article.content,
            published: article.published,
          }}
        />
      </div>
    </div>
  );
}
