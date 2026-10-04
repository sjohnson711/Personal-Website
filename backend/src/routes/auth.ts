import { Router, Request, Response } from "express";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/requireAuth";
import { asyncHandler } from "../lib/asyncHandler";
import { loginSchema, validate } from "../lib/validation";

const router = Router();

router.post("/login", validate(loginSchema), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const isValid = await bcrypt.compare(password as string, admin.password);
  if (!isValid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign(
    { id: admin.id, email: admin.email },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" },
  );

  const isProd = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ email: admin.email });
}));

router.post("/logout", (_req: Request, res: Response): void => {
  const isProd = process.env.NODE_ENV === "production";

  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  });
  res.json({ success: true });
});

router.get("/me", requireAuth, (req: AuthRequest, res: Response): void => {
  // Temporary authenticated release check. Returns booleans/counts only; remove after verification.
  if (req.query.proxyProbe === "1") {
    const forwarded = (req.get("X-Forwarded-For") ?? "").split(",").map((v) => v.trim()).filter(Boolean);
    const expected = req.get("X-Release-Expected-Ip-Hash") ?? "";
    res.json({ email: req.adminEmail, proxyProbe: { forwardedCount: forwarded.length,
      matchingClientIndex: forwarded.findIndex((ip) => createHash("sha256").update(ip).digest("hex") === expected),
      sentinelPresent: forwarded.includes("203.0.113.7") || forwarded.includes("203.0.113.8") } }); return;
  }
  res.json({ email: req.adminEmail });
});

export default router;
