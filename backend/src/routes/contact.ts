import { Router, Request, Response } from "express";
import { Resend } from "resend";

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    if (message.length > 5000) {
      res.status(400).json({ error: "Message too long" });
      return;
    }

    // Extract email address if FROM_EMAIL contains a name (e.g., "Seth Johnson <email@example.com>")
    let fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";
    const emailMatch = fromEmail.match(/<(.+?)>/);
    if (emailMatch) {
      fromEmail = emailMatch[1];
    }

    const result = await resend.emails.send({
      from: fromEmail,
      to: "samaritanbrotherseth@gmail.com",
      subject: `New Contact Message from ${name}`,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; background: #F7F4EF; padding: 40px;">
          <div style="background: #FFFFFF; border: 1px solid #EAE4D8; border-radius: 8px; padding: 32px; max-width: 600px;">
            <p style="color: #B8962E; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 16px;">
              New Contact Message
            </p>
            <h2 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #0F1B35; font-family: 'Playfair Display', Georgia, serif;">
              From: ${name}
            </h2>
            <p style="margin: 0 0 8px; color: #6B6560; font-size: 14px;">
              <strong>Email:</strong> <a href="mailto:${email}" style="color: #B8962E; text-decoration: none;">${email}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #EAE4D8; margin: 24px 0;" />
            <div style="color: #2D2926; font-size: 16px; line-height: 1.75; white-space: pre-wrap;">
              ${message}
            </div>
          </div>
        </div>
      `,
      replyTo: email,
    });

    if (result.error || !result.data) {
      console.error("[resend] Error sending contact email:", result.error);
      res.status(500).json({ error: "Failed to send message. Please try again later." });
      return;
    }

    console.log("[resend] Contact email sent successfully:", result.data.id);
    res.json({ success: true, message: "Message sent successfully" });
  } catch (err) {
    console.error("[contact] Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
