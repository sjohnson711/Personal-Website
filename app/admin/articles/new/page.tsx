import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ArticleEditor from "@/components/ArticleEditor";

export default async function NewArticlePage() {
  const session = await auth();
  if (!session?.user) redirect("/gateway");

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col gap-8">
      <header>
        <h1 className="font-serif text-3xl font-bold" style={{ color: "#fbbf24" }}>
          New Article
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
      </header>

      <div className="glass-card p-8">
        <ArticleEditor mode="new" />
      </div>
    </div>
  );
}
