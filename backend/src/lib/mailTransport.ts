import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { Resend } from "resend";

export interface Mail { from: string; to: string; subject: string; html: string; text: string; replyTo?: string; }
export class MailError extends Error {
  constructor(public code: string, public transient: boolean) { super(code); }
}

export async function sendMail(mail: Mail, idempotencyKey?: string): Promise<string> {
  if (process.env.MAIL_MODE === "capture") {
    if (process.env.NODE_ENV === "production") throw new MailError("capture_disabled_in_production", false);
    const path = process.env.MAIL_CAPTURE_PATH;
    if (!path) throw new MailError("missing_capture_path", false);
    await mkdir(dirname(path), { recursive: true });
    await appendFile(path, JSON.stringify({ ...mail, idempotencyKey, capturedAt: new Date().toISOString() }) + "\n");
    return `local-${randomUUID()}`;
  }
  if (!process.env.RESEND_API_KEY) throw new MailError("missing_email_configuration", false);
  const { data, error } = await new Resend(process.env.RESEND_API_KEY).emails.send(mail, idempotencyKey ? { idempotencyKey } : undefined);
  if (error) {
    const status = "statusCode" in error ? Number(error.statusCode) : 0;
    throw new MailError(error.name, status === 429 || status >= 500 || status === 0);
  }
  if (!data?.id) throw new MailError("missing_provider_receipt", true);
  return data.id;
}
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
}
