import { z } from "zod";
import { RequestHandler } from "express";

export const emailSchema = z.string().trim().email().max(254).transform((v) => v.toLowerCase());
export const articleSchema = z.object({
  title: z.string().trim().min(1).max(300),
  slug: z.string().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens for the slug").refine((v) => !/^\d+$/.test(v), "The slug must include a letter or hyphen so it cannot be confused with an article ID"),
  excerpt: z.string().trim().min(1).max(2000),
  content: z.string().min(1).refine((v) => v.trim().length > 0).refine((v) => Buffer.byteLength(v) <= 8 * 1024 * 1024, "Article exceeds the 8 MB limit"),
  published: z.boolean().optional(),
}).strict();
export const subscribeSchema = z.object({ email: emailSchema }).strict();
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(200) }).strict();
export const commentSchema = z.object({ name: z.string().trim().min(1).max(100), body: z.string().trim().min(1).max(2000) }).strict();
export const contactSchema = z.object({ name: z.string().trim().min(1).max(100), email: emailSchema, message: z.string().trim().min(1).max(5000) }).strict();

export function validate(schema: z.ZodType): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) { res.status(400).json({ error: result.error.issues[0]?.message ?? "Invalid request" }); return; }
    req.body = result.data;
    next();
  };
}
export function positiveId(value: unknown): number | null {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n <= 2147483647 ? n : null;
}
