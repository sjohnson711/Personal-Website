import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/requireAuth";

const router = Router();

router.post("/login", async (req: Request, res: Response): Promise<void> => {
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

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ email: admin.email });
});

router.post("/logout", (_req: Request, res: Response): void => {
  res.clearCookie("token");
  res.json({ success: true });
});

router.get("/me", requireAuth, (req: AuthRequest, res: Response): void => {
  res.json({ email: req.adminEmail });
});

export default router;
