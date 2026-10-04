import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { subscribeSchema, validate } from "../lib/validation";
import { escapeHtml } from "../lib/mailTransport";

const router = Router();

// POST /api/subscribers
router.post("/", validate(subscribeSchema), asyncHandler(async (req, res) => {
  const email: string = req.body.email;
  try {
    await prisma.$transaction(async (tx) => {
      const sub = await tx.subscriber.create({ data: { email, unsubscribeToken: randomUUID() } });
      await tx.notificationJob.create({ data: { subscriberEmail: email, signupAt: sub.createdAt } });
      await tx.interaction.create({ data: { kind: "subscription", sourceId: String(sub.id), email, createdAt: sub.createdAt } });
    });
  } catch (err) {
    if (!(typeof err === "object" && err && "code" in err && err.code === "P2002")) throw err;
  }
  res.json({ message: "Your subscription is registered. Thank you!" });
}));

// GET /api/subscribers/unsubscribe/:token  (clicked from email footer)
router.get(
  "/unsubscribe/:token",
  asyncHandler(async (req: Request<{ token: string }>, res: Response): Promise<void> => {
    const { token } = req.params;
    if (!/^[0-9a-f-]{36}$/i.test(token)) { res.status(404).send("Unsubscribe link not found."); return; }

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

    await prisma.$transaction([
      prisma.interaction.updateMany({ where: { kind: "subscription", sourceId: String(subscriber.id) }, data: { email: null } }),
      prisma.subscriber.deleteMany({ where: { id: subscriber.id } }),
    ]);

    const siteUrl = escapeHtml(process.env.SITE_URL ?? "http://localhost:5173");
    res.send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#F7F4EF;">
        <h2 style="font-family:Georgia,serif;color:#0F1B35;">You've been unsubscribed.</h2>
        <p style="color:#6B6560;">You won't receive any more emails from this newsletter.</p>
        <a href="${siteUrl}" style="color:#B8962E;">← Back to the site</a>
      </body></html>
    `);
  }),
);

export default router;
