import { Router } from "express";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { contactSchema, validate } from "../lib/validation";
import { sendMail, escapeHtml, mailDeliveryEnabled } from "../lib/mailTransport";

const router = Router();
router.post("/", validate(contactSchema), asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;
  if (!mailDeliveryEnabled()) { res.status(503).json({ error: "The contact form is temporarily unavailable. Please try again later." }); return; }
  try {
    await sendMail({ from: process.env.FROM_EMAIL ?? "onboarding@resend.dev", to: "samaritanbrotherseth@gmail.com",
      subject: `New Contact Message from ${name}`, replyTo: email,
      text: `From: ${name}\nEmail: ${email}\n\n${message}`,
      html: `<h1>New Contact Message</h1><p>From: ${escapeHtml(name)}</p><p>Email: ${escapeHtml(email)}</p><div style="white-space:pre-wrap">${escapeHtml(message)}</div>`,
    });
  } catch { res.status(502).json({ error: "Failed to send message. Please try again later." }); return; }
  // Don't ask someone to resend an already-delivered message if metrics fail.
  await prisma.interaction.create({ data: { kind: "contact", sourceId: randomUUID(), name, email } })
    .catch(() => console.error("[analytics] Contact activity could not be recorded"));
  res.json({ success: true, message: "Message sent successfully" });
}));
export default router;
