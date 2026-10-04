import { prisma } from "./prisma";
import { sendMail, escapeHtml } from "./mailTransport";

export async function notifySubscribers(article: { title: string; slug: string; excerpt: string }): Promise<void> {
  const siteUrl = process.env.SITE_URL ?? "http://localhost:5173";
  const apiUrl = process.env.PUBLIC_API_URL ?? "https://personal-website-production-b2f4.up.railway.app/api";
  const subscribers = await prisma.subscriber.findMany();
  // Sequential sends avoid large unchecked batches and handle provider errors.
  for (const sub of subscribers) {
    const link = `${siteUrl}/articles/${encodeURIComponent(article.slug)}`;
    const unsubscribe = `${apiUrl}/subscribers/unsubscribe/${sub.unsubscribeToken}`;
    try {
      await sendMail({ from: process.env.FROM_EMAIL ?? "onboarding@resend.dev", to: sub.email,
        subject: `New Post: ${article.title}`,
        text: `${article.title}\n\n${article.excerpt}\n\nRead: ${link}\nUnsubscribe: ${unsubscribe}`,
        html: `<div style="font-family:Arial,sans-serif;background:#f7f4ef;color:#0f1b35;padding:32px"><h1>${escapeHtml(article.title)}</h1><p>${escapeHtml(article.excerpt)}</p><p><a href="${escapeHtml(link)}">Read the full article</a></p><p><a href="${escapeHtml(unsubscribe)}">Unsubscribe</a></p></div>`,
      });
    } catch { console.error("[newsletter] A publication email could not be sent"); }
  }
}
