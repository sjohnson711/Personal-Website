import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import { prisma } from "../lib/prisma";

const router = Router();

// POST /api/subscribers
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };

  if (!email?.trim()) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const normalised = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalised)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  const existing = await prisma.subscriber.findUnique({ where: { email: normalised } });
  if (existing) {
    // 200 so the form does not reveal whether an address is already registered
    res.json({ message: "You're already subscribed!" });
    return;
  }

  await prisma.subscriber.create({
    data: { email: normalised, unsubscribeToken: randomUUID() },
  });

  res.status(201).json({ message: "Subscribed successfully!" });
});

// GET /api/subscribers/unsubscribe/:token  (clicked from email footer)
router.get(
  "/unsubscribe/:token",
  async (req: Request<{ token: string }>, res: Response): Promise<void> => {
    const { token } = req.params;

    const subscriber = await prisma.subscriber.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!subscriber) {
      res.status(404).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:60px;">
          <h2>Link not found</h2>
          <p>This unsubscribe link is invalid or has already been used.</p>
        </body></html>
      `);
      return;
    }

    await prisma.subscriber.delete({ where: { unsubscribeToken: token } });

    const siteUrl = process.env.SITE_URL ?? "http://localhost:5173";
    res.send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#F7F4EF;">
        <h2 style="font-family:Georgia,serif;color:#0F1B35;">You've been unsubscribed.</h2>
        <p style="color:#6B6560;">You won't receive any more emails from this newsletter.</p>
        <a href="${siteUrl}" style="color:#B8962E;">← Back to the site</a>
      </body></html>
    `);
  },
);

export default router;
