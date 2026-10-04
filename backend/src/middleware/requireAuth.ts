import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request { adminId?: number; adminEmail?: string; }
function payload(req: Request): { id: number; email: string } | null {
  const token = req.cookies?.token ?? (req.get("Authorization")?.startsWith("Bearer ") ? req.get("Authorization")!.slice(7) : undefined);
  if (typeof token !== "string") return null;
  try {
    const value = jwt.verify(token, process.env.JWT_SECRET!, { algorithms: ["HS256"] });
    if (typeof value === "string" || !Number.isSafeInteger(value.id) || value.id < 1 || typeof value.email !== "string" || !value.email || typeof value.exp !== "number") return null;
    return { id: value.id, email: value.email };
  } catch { return null; }
}
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const admin = payload(req);
  if (!admin) { res.status(401).json({ error: "Unauthorized" }); return; }
  req.adminId = admin.id;
  req.adminEmail = admin.email;
  res.set("Cache-Control", "no-store");
  next();
}
export function getOptionalAuth(req: Request): boolean { return Boolean(payload(req)); }
