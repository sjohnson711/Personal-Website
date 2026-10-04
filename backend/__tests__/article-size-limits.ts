import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { articleSchema } from "../src/lib/validation";

async function main() {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "article-size-test-secret-not-used-in-production";
  process.env.DATABASE_URL = "postgresql://size_test@127.0.0.1:1/no_database";
  process.env.FRONTEND_URL = "http://127.0.0.1:5175";
  process.env.TRUST_PROXY_HOPS = "0";
  const { createApp } = await import("../src/app");
  const { prisma } = await import("../src/lib/prisma");
  const article = { title: "Image article", slug: "image-article", excerpt: "Preview", published: false };
  const enlarged = "x".repeat(12 * 1024 * 1024);
  assert.ok(articleSchema.safeParse({ ...article, content: enlarged }).success);
  assert.ok(!articleSchema.safeParse({ ...article, content: "x".repeat(32 * 1024 * 1024 + 1) }).success);
  assert.ok(!articleSchema.safeParse({ ...article, content: "\u00e9".repeat(16 * 1024 * 1024 + 1) }).success, "Validation counts UTF-8 bytes");
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
  const token = jwt.sign({ id: 1, email: "size-test@example.test" }, process.env.JWT_SECRET, { expiresIn: "5m" });
  const headers = { Origin: process.env.FRONTEND_URL, "X-Requested-With": "PersonalWebsite", "Content-Type": "application/json" };
  // Invalid article metadata stops at validation, so these checks never use a database.
  const post = (path: string, content: string, authenticated = true) => fetch(base + path, { method: "POST", headers: { ...headers, ...(authenticated ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ content }) });
  try {
    const accepted = await post("/articles", enlarged);
    assert.equal(accepted.status, 400, "12 MB article body reaches validation instead of failing the parser");
    assert.notEqual((await accepted.json() as { error: string }).error, "Request is too large");
    assert.equal((await post("/articles", "x".repeat(32 * 1024 * 1024))).status, 413);
    assert.equal((await post("/articles", enlarged, false)).status, 401, "Large writes still authenticate before parsing");
    assert.equal((await post("/contact", "x".repeat(20 * 1024), false)).status, 413, "Public form limits remain 16 KB");
    console.log("PASS enlarged article schema and JSON parser limits, UTF-8 byte boundaries, authentication, and public form cap.");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
