import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { ensureLocalDatabase, root, cache } from "./local-environment.mjs";

const env = { ...ensureLocalDatabase("personal_review_tests"), MAIL_CAPTURE_PATH: resolve(cache, "test-emails.jsonl") };
execFileSync(process.execPath, ["--import", "tsx", "backend/__tests__/integration.ts"], { cwd: root, env, windowsHide: true, stdio: "inherit" });
