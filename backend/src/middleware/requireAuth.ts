import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  adminId?: number;
  adminEmail?: string;
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  const token =
    req.cookies?.token ?? req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      email: string;
    };
    req.adminId = payload.id;
    req.adminEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

export function getOptionalAuth(req: Request): boolean {
  const token = req.cookies?.token;
  if (!token) return false;
  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    return true;
  } catch {
    return false;
  }
}
