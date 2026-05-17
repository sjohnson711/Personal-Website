import { Resend } from "resend";
import { prisma } from "./prisma";

export async function notifySubscribers(article: {
  title: string;
  slug: string;
  excerpt: string;
}): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const subscribers = await prisma.subscriber.findMany();
  if (subscribers.length === 0) return;

  const siteUrl = process.env.SITE_URL ?? "http://localhost:5173";
  const fromEmail = process.env.FROM_EMAIL ?? "onboarding@resend.dev";

  const messages = subscribers.map((sub) => ({
    from: fromEmail,
    to: sub.email,
    subject: `New Post: ${article.title}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
      <body style="margin:0;padding:0;background:#F7F4EF;font-family:'DM Sans',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EF;padding:40px 0;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#0F1B35;border-radius:12px;overflow:hidden;max-width:600px;">
              <tr>
                <td style="padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.08);">
                  <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#B8962E;">
                    Seth Johnson · New Article
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:36px 40px 32px;">
                  <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:26px;font-weight:900;color:#F7F4EF;line-height:1.2;">
                    ${article.title}
                  </h1>
                  <p style="margin:0 0 28px;font-size:16px;line-height:1.75;color:#9A9490;">
                    ${article.excerpt}
                  </p>
                  <a href="${siteUrl}/articles/${article.slug}"
                     style="display:inline-block;padding:12px 28px;background:#B8962E;color:#0F1B35;font-weight:700;font-size:15px;text-decoration:none;border-radius:6px;">
                    Read the Full Article →
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 40px 28px;border-top:1px solid rgba(255,255,255,0.08);">
                  <p style="margin:0;font-size:12px;color:#5A5550;line-height:1.6;">
                    You're receiving this because you subscribed at ${siteUrl}.<br/>
                    <a href="${siteUrl}/api/subscribers/unsubscribe/${sub.unsubscribeToken}"
                       style="color:#B8962E;text-decoration:underline;">
                      Unsubscribe
                    </a>
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  }));

  // Fire-and-forget — email failure never blocks the article API response
  resend.batch.send(messages).catch((err: unknown) => {
    console.error("[resend] Failed to send subscriber emails:", err);
  });
}
