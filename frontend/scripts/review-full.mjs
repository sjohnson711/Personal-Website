import { spawn, execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer } from "vite";
import { ensureLocalDatabase, root, reviewEnv } from "../../backend/scripts/local-environment.mjs";

ensureLocalDatabase();
execFileSync(process.execPath, ["--import", "tsx", "backend/scripts/seed-review.ts"], { cwd: root, env: { ...reviewEnv, RESET_REVIEW_SAMPLE: process.argv.includes("--reset-sample") ? "1" : "0" }, stdio: "inherit", windowsHide: true });
const backend = spawn(process.execPath, ["--import", "tsx", "backend/src/index.ts"], { cwd: root, env: reviewEnv, stdio: "inherit", windowsHide: true });
const server = await createServer({ root: resolve(root, "frontend"), configFile: resolve(root, "frontend/vite.config.ts"), envFile: false,
  cacheDir: resolve(root, "node_modules/.cache/local-review/vite"), define: { "import.meta.env.VITE_API_URL": JSON.stringify("/api") },
  server: { host: "127.0.0.1", port: 5174, strictPort: true, proxy: { "/api": { target: "http://127.0.0.1:3002", changeOrigin: true } } },
  plugins: [{ name: "review-banner", transformIndexHtml() { return [{ tag: "div", injectTo: "body-prepend", attrs: { style: "background:#0f1b35;color:#f7f4ef;padding:10px 16px;text-align:center;font:14px system-ui" }, children: "LOCAL REVIEW · Sample data · Emails captured locally · No production writes" }]; },
    configureServer(vite) {
      vite.middlewares.use("/__review/mailbox", async (_req, res) => {
        let records = [];
        try { records = (await readFile(reviewEnv.MAIL_CAPTURE_PATH, "utf8")).trim().split("\n").filter(Boolean).map(JSON.parse); } catch { /* empty mailbox */ }
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'");
        res.end(`<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font:16px system-ui;max-width:800px;margin:40px auto;padding:0 16px;overflow-wrap:anywhere"><h1>Local captured emails (${records.length})</h1>${records.slice().reverse().map((record) => `<article style="padding:24px;border:1px solid #ddd;margin:16px 0">${record.html}</article>`).join("")}</body></html>`);
      });
    } }],
});
await server.listen();
server.printUrls();
console.log("Admin: review@letterofforgiveness.test / ReviewLocalOnly!2026");
console.log("Captured emails: http://127.0.0.1:5174/__review/mailbox");
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, async () => { backend.kill(); await server.close(); process.exit(0); });
backend.once("exit", async (code) => { if (code) { await server.close(); process.exit(code); } });
