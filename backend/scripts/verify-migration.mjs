import { Client } from "pg";
import { readFile, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { ensureLocalDatabase, root } from "./local-environment.mjs";

const env = ensureLocalDatabase("personal_review_migration_tests", false);
assert.equal(env.DATABASE_URL, "postgresql://review@127.0.0.1:5433/personal_review_migration_tests");
const client = new Client({ connectionString: env.DATABASE_URL }); await client.connect();
const cli = (...args) => execFileSync(process.execPath, [resolve(root, "node_modules/prisma/build/index.js"), ...args], { cwd: resolve(root, "backend"), env, windowsHide: true, stdio: "inherit" });
try {
  // Reset only this purpose-built migration fixture, never review/production data.
  await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public");
  const migrations = (await readdir(resolve(root, "backend/prisma/migrations"), { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  for (const migration of migrations.filter((name) => !name.includes("add_analytics_and_signup_alerts"))) {
    await client.query(await readFile(resolve(root, "backend/prisma/migrations", migration, "migration.sql"), "utf8"));
    cli("migrate", "resolve", "--applied", migration);
  }
  const recent = new Date(), old = new Date(Date.now() - 100 * 24 * 60 * 60_000);
  const content = "O'Connor's original article\n\n![](https://example.com/photo.png)\n\nAfter";
  const article = (await client.query('INSERT INTO "Article" (title, slug, excerpt, content, published, "updatedAt") VALUES ($1,$2,$3,$4,false,$5) RETURNING id', ["Original draft", "original", "Keep me", content, recent])).rows[0];
  for (const [email, createdAt] of [["recent@example.com", recent], ["older@example.com", old]]) {
    await client.query('INSERT INTO "Subscriber" (email,"unsubscribeToken","createdAt") VALUES ($1,$2,$3)', [email, `token-${email}`, createdAt]);
    await client.query('INSERT INTO "Comment" ("articleId",name,body,"createdAt") VALUES ($1,$2,$3,$4)', [article.id, email, "Keep my message", createdAt]);
  }
  cli("migrate", "deploy");
  assert.equal((await client.query('SELECT content,published FROM "Article"')).rows[0].content, content);
  assert.equal((await client.query('SELECT content,published FROM "Article"')).rows[0].published, false);
  assert.equal((await client.query('SELECT COUNT(*)::int AS n FROM "Subscriber"')).rows[0].n, 2);
  assert.equal((await client.query('SELECT COUNT(*)::int AS n FROM "Comment"')).rows[0].n, 2);
  assert.equal((await client.query('SELECT COUNT(*)::int AS n FROM "Interaction"')).rows[0].n, 2);
  assert.equal((await client.query('SELECT COUNT(*)::int AS n FROM "NotificationJob"')).rows[0].n, 0);
  cli("migrate", "diff", "--from-config-datasource", "--to-schema", "prisma/schema.prisma", "--exit-code");
  console.log("PASS additive migration preserves existing drafts, article content, subscribers, and comments; backfills only recent interactions; sends no historical alerts; schema matches Prisma.");
} finally { await client.end(); }
