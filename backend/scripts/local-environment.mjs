import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const cache = resolve(root, "node_modules/.cache/local-review");
export const reviewEnv = { ...process.env, NODE_ENV: "development", DATABASE_URL: "postgresql://review@127.0.0.1:5433/personal_review",
  JWT_SECRET: "local-review-secret-only-never-use-in-production-2026", MAIL_MODE: "capture", MAIL_CAPTURE_PATH: resolve(cache, "emails.jsonl"),
  FROM_EMAIL: "Local Review <review@letterofforgiveness.test>", SITE_URL: "http://127.0.0.1:5174", PUBLIC_API_URL: "http://127.0.0.1:3002/api",
  REVIEW_AVATAR_PATH: resolve(root, "frontend/public/profile-avatar.webp"),
  FRONTEND_URL: "http://127.0.0.1:5174", PORT: "3002", BIND_HOST: "127.0.0.1", TRUST_PROXY_HOPS: "0" };
export function ensureLocalDatabase(database = "personal_review", migrate = true) {
  if (!["personal_review", "personal_review_tests", "personal_review_migration_tests"].includes(database)) throw new Error("Only isolated review databases are allowed");
  const bin = process.env.PG_BIN ?? "C:/Program Files/PostgreSQL/18/bin";
  const data = resolve(cache, "pgdata");
  mkdirSync(cache, { recursive: true });
  const pg = (name, args, options = {}) => execFileSync(resolve(bin, `${name}.exe`), args, { windowsHide: true, encoding: "utf8", ...options });
  if (!existsSync(resolve(data, "PG_VERSION"))) pg("initdb", ["-D", data, "-U", "review", "--auth=trust", "--encoding=UTF8", "--locale=C"]);
  let running = false;
  try { pg("pg_ctl", ["-D", data, "status"], { stdio: "ignore" }); running = true; } catch { /* start our isolated cluster */ }
  if (!running) pg("pg_ctl", ["-D", data, "-l", resolve(cache, "postgres.log"), "-o", "-h 127.0.0.1 -p 5433", "-w", "start"], { stdio: "ignore" });
  const exists = pg("psql", ["-h", "127.0.0.1", "-p", "5433", "-U", "review", "-d", "postgres", "-tAc", `SELECT 1 FROM pg_database WHERE datname = '${database}'`]).trim();
  if (!exists) pg("createdb", ["-h", "127.0.0.1", "-p", "5433", "-U", "review", database]);
  const env = { ...reviewEnv, DATABASE_URL: `postgresql://review@127.0.0.1:5433/${database}` };
  if (migrate) execFileSync(process.execPath, [resolve(root, "node_modules/prisma/build/index.js"), "migrate", "deploy"], { cwd: resolve(root, "backend"), env, windowsHide: true, stdio: "inherit" });
  console.log(`Isolated local database ready at 127.0.0.1:5433/${database}.`);
  return env;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) ensureLocalDatabase();
