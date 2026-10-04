import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
let article = { id: 1, title: "A new beginning", slug: "editor-preview", excerpt: "Making room for forgiveness.",
  content: "## A new beginning\n\nWrite your next article here.", published: false, createdAt: new Date().toISOString() };
const server = await createServer({ root, configFile: fileURLToPath(new URL("../vite.config.ts", import.meta.url)), envFile: false,
  cacheDir: fileURLToPath(new URL("../../node_modules/.cache/editor-preview/vite", import.meta.url)),
  define: { "import.meta.env.VITE_API_URL": JSON.stringify("/api") },
  server: { host: "127.0.0.1", port: 5175, strictPort: true },
  plugins: [{ name: "editor-preview", configureServer(vite) {
    vite.middlewares.use("/api", async (request, response) => {
      const send = (body, status = 200) => {
        response.statusCode = status; response.setHeader("Content-Type", "application/json");
        response.setHeader("Cache-Control", "no-store"); response.end(JSON.stringify(body));
      };
      const url = new URL(request.url, "http://127.0.0.1:5175");
      const path = url.pathname;
      if (request.method === "GET") {
        if (path === "/auth/me") return send({ email: "local-preview@example.test" });
        if (path === "/articles") return send({ articles: [article], total: 1, page: 1, totalPages: 1 });
        if (path === "/articles/1" || path === "/articles/editor-preview" || path === `/articles/${article.slug}`) return send(article);
        if (path.startsWith("/comments/")) return send([]);
      }
      if ((request.method === "PUT" && path === "/articles/1") || (request.method === "POST" && path === "/articles")) {
        const chunks = []; let size = 0;
        for await (const chunk of request) { size += chunk.length; if (size > 32 * 1024 * 1024) return send({ message: "Article exceeds 32 MB." }, 413); chunks.push(chunk); }
        try { article = { ...article, ...JSON.parse(Buffer.concat(chunks).toString("utf8")), id: 1 }; return send(article); }
        catch { return send({ message: "Invalid article." }, 400); }
      }
      request.resume(); send({ message: "This local editor preview supports sample articles only." }, 405);
    });
  } }],
});
await server.listen();
console.log("Editor preview: http://127.0.0.1:5175/admin/articles/1/edit");
console.log("Sample changes are kept in memory only. No production requests or emails.");
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, async () => { await server.close(); process.exit(0); });
