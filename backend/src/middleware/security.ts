import { RequestHandler } from "express";
import rateLimit from "express-rate-limit";

export function allowedOrigins(): string[] {
  const origins = ["https://letterofforgiveness.com", "https://www.letterofforgiveness.com", process.env.FRONTEND_URL,
    ...(process.env.PREVIEW_ORIGINS ?? "").split(",")];
  if (process.env.NODE_ENV !== "production") origins.push("http://localhost:5173", "http://127.0.0.1:5173", "http://127.0.0.1:5174");
  return [...new Set(origins.filter((v): v is string => Boolean(v?.trim())).map((v) => new URL(v.trim()).origin))];
}
// Custom headers trigger preflight; exact Origin checks also reject forged forms.
// The token-bearing unsubscribe GET is the only public write exception.
export const csrfProtection: RequestHandler = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (!allowedOrigins().includes(req.get("Origin") ?? "") || req.get("X-Requested-With") !== "PersonalWebsite" || !req.is("application/json")) {
    res.status(403).json({ error: "Request origin or security header is invalid" }); return;
  }
  next();
};
export function limiter(limit: number, windowMs = 15 * 60_000) {
  return rateLimit({ windowMs, limit, standardHeaders: "draft-8", legacyHeaders: false,
    message: { error: "Too many requests. Please try again later." } });
}
