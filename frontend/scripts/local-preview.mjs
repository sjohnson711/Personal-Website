import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

// This script only reads public production content. All preview API requests
// are served from the local snapshot; submissions never reach production.
const source = "https://personal-website-production-b2f4.up.railway.app/api";
const snapshotFile = new URL("../../node_modules/.cache/personal-website-preview/content.json", import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));

async function publicJson(path) {
  const response = await fetch(`${source}${path}`, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Public content request failed (${response.status}).`);
  return response.json();
}

async function loadSnapshot() {
  try {
    const first = await publicJson("/articles?page=1");
    if (!Array.isArray(first.articles)) throw new Error("Invalid public article response.");
    const articles = [...first.articles];
    for (let page = 2; page <= first.totalPages; page += 1) {
      articles.push(...(await publicJson(`/articles?page=${page}`)).articles);
    }
    const published = articles.filter((article) => article.published);
    const comments = {};
    for (const article of published) {
      comments[article.id] = await publicJson(`/comments/${article.id}`);
    }
    const snapshot = { articles: published, comments, capturedAt: new Date().toISOString() };
    await mkdir(new URL("./", snapshotFile), { recursive: true });
    await writeFile(snapshotFile, JSON.stringify(snapshot));
    return snapshot;
  } catch (error) {
    try {
      const snapshot = JSON.parse(await readFile(snapshotFile, "utf8"));
      console.log(`Using the cached public content from ${snapshot.capturedAt}.`);
      return snapshot;
    } catch {
      throw error;
    }
  }
}

const snapshot = await loadSnapshot();
const server = await createServer({
  root,
  cacheDir: fileURLToPath(new URL("../../node_modules/.cache/personal-website-preview/vite", import.meta.url)),
  configFile: fileURLToPath(new URL("../vite.config.ts", import.meta.url)),
  envFile: false,
  define: { "import.meta.env.VITE_API_URL": JSON.stringify("/api") },
  server: { host: "127.0.0.1", port: 5173, strictPort: true, open: false },
  plugins: [{
    name: "local-preview-content",
    transformIndexHtml() {
      return [{
        tag: "div",
        injectTo: "body-prepend",
        attrs: { style: "background:#0f1b35;color:#f7f4ef;padding:8px 16px;text-align:center;font:13px system-ui,sans-serif" },
        children: "Local preview · Published article snapshot · Forms won't send",
      }];
    },
    configureServer(vite) {
      vite.middlewares.use("/api", (request, response) => {
        const send = (body, status = 200) => {
          response.statusCode = status;
          response.setHeader("Content-Type", "application/json");
          response.setHeader("Cache-Control", "no-store");
          response.end(JSON.stringify(body));
        };
        if (request.method !== "GET") {
          request.resume();
          send({ message: "This is a local preview. Messages, subscriptions, comments, and admin changes aren't submitted." }, 405);
          return;
        }
        const url = new URL(request.url, "http://127.0.0.1:5173");
        if (url.pathname === "/auth/me") return send(null);
        if (url.pathname === "/articles") {
          const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
          return send({
            articles: snapshot.articles.slice((page - 1) * 7, page * 7),
            total: snapshot.articles.length,
            page,
            totalPages: Math.max(1, Math.ceil(snapshot.articles.length / 7)),
          });
        }
        if (url.pathname.startsWith("/articles/")) {
          const slug = decodeURIComponent(url.pathname.slice("/articles/".length));
          const article = snapshot.articles.find((item) => item.slug === slug || String(item.id) === slug);
          return article ? send(article) : send({ message: "Article not found." }, 404);
        }
        if (url.pathname.startsWith("/comments/")) {
          return send(snapshot.comments[url.pathname.slice("/comments/".length)] ?? []);
        }
        send({ message: "This endpoint is unavailable in the local preview." }, 404);
      });
    },
  }],
});
await server.listen();
console.log(`Loaded ${snapshot.articles.length} published articles for local review.`);
server.printUrls();
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, async () => { await server.close(); process.exit(0); });
}
