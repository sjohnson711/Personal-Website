import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AdminArticleRow from "@/components/AdminArticleRow";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/gateway");

  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      published: true,
      createdAt: true,
    },
  });

  const published = articles.filter((a) => a.published).length;
  const drafts = articles.length - published;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-8">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="font-serif text-3xl font-bold" style={{ color: "#fbbf24" }}>
            Admin Dashboard
          </h1>
          <p style={{ color: "#a89070", marginTop: "0.3rem", fontSize: "0.9rem" }}>
            Welcome back, {session.user.email}
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          style={{
            padding: "0.65rem 1.5rem",
            borderRadius: "0.5rem",
            backgroundColor: "#217346",
            color: "#fff7ed",
            fontWeight: 700,
            textDecoration: "none",
            fontSize: "0.95rem",
          }}
        >
          + New Article
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        {[
          { label: "Total", value: articles.length },
          { label: "Published", value: published },
          { label: "Drafts", value: drafts },
        ].map(({ label, value }) => (
          <div key={label} className="glass-card p-5 text-center">
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "#fbbf24" }}>{value}</p>
            <p style={{ color: "#a89070", fontSize: "0.85rem" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Article list */}
      <div className="glass-card overflow-hidden">
        <div
          style={{
            padding: "0.75rem 1.5rem",
            borderBottom: "1px solid rgba(64, 145, 108, 0.25)",
            display: "grid",
            gridTemplateColumns: "1fr auto auto",
            gap: "1rem",
          }}
        >
          <span style={{ color: "#40916c", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Title</span>
          <span style={{ color: "#40916c", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</span>
          <span style={{ color: "#40916c", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</span>
        </div>

        {articles.length === 0 ? (
          <p style={{ padding: "2rem 1.5rem", color: "#a89070", textAlign: "center" }}>
            No articles yet. Write your first one!
          </p>
        ) : (
          articles.map((article) => (
            <AdminArticleRow key={article.id} article={article} />
          ))
        )}
      </div>
    </div>
  );
}
