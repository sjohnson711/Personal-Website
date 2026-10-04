import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { chromium } from "playwright";
import assert from "node:assert/strict";

const dist = resolve("frontend/dist");
const config = JSON.parse(await readFile("vercel.json", "utf8"));
const types = { ".html": "text/html; charset=utf-8", ".js": "application/javascript", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon" };
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, "http://localhost").pathname;
    if (path.startsWith("/api/")) {
      if (req.method === "POST" && path === "/api/analytics/pageviews") { req.resume(); res.writeHead(204); res.end(); return; }
      if (req.method !== "GET") { req.resume(); res.writeHead(405); res.end(); return; }
      const response = await fetch(`http://127.0.0.1:3002${req.url}`);
      res.writeHead(response.status, { "Content-Type": "application/json", "Cache-Control": "no-store" }); res.end(await response.text()); return;
    }
    for (const header of config.headers[0].headers) res.setHeader(header.key, header.value);
    let file = resolve(dist, "." + path);
    if (file !== dist && !file.startsWith(dist + sep)) { res.writeHead(403); res.end(); return; }
    try { if (!(await stat(file)).isFile()) file = resolve(dist, "index.html"); } catch { file = resolve(dist, "index.html"); }
    res.setHeader("Content-Type", types[extname(file)] ?? "application/octet-stream");
    res.end(await readFile(file));
  } catch { res.writeHead(500); res.end(); }
});
server.listen(0, "127.0.0.1"); await new Promise((resolve) => server.once("listening", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.addInitScript(() => { window.__csp = []; document.addEventListener("securitypolicyviolation", (event) => window.__csp.push(`${event.violatedDirective}: ${event.blockedURI}`)); });
try {
  const response = await page.goto(base + "/");
  assert.ok(response.headers()["content-security-policy"].includes("script-src 'self'"));
  await page.getByRole("heading", { name: "Local image placement test", level: 1 }).waitFor();
  await page.goto(base + "/articles/local-image-test");
  await page.locator(".prose-ink img").waitFor();
  await page.locator(".prose-ink img").scrollIntoViewIfNeeded();
  await page.waitForFunction(() => { const img = document.querySelector(".prose-ink img"); return img.complete && img.naturalWidth > 0; });
  assert.ok(await page.locator(".prose-ink img").evaluate((img) => img.complete && img.naturalWidth > 0), "Pasted WebP renders under production CSP");
  assert.deepEqual(await page.evaluate(() => window.__csp), []);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/privacy");
  await page.getByRole("heading", { name: "Privacy and site activity" }).waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(await page.evaluate(() => window.__csp), []);
  assert.deepEqual(errors, []);
  console.log("PASS production build with actual Vercel CSP/security headers, SPA routes, inline images, mobile layout, and no runtime/CSP violations.");
} finally { await browser.close(); await new Promise((resolve) => server.close(resolve)); }
