import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { prisma } from "../src/lib/prisma";
import { processNotifications } from "../src/lib/notifications";

async function seed() {
  await prisma.admin.upsert({ where: { email: "review@letterofforgiveness.test" }, update: {}, create: { email: "review@letterofforgiveness.test", password: await bcrypt.hash("ReviewLocalOnly!2026", 10) } });
  const image = (await readFile(process.env.REVIEW_AVATAR_PATH!)).toString("base64");
  const content = `## Before the image\n\nThis text should remain above the image. Edit this article and paste another image in the middle.\n\n![Author portrait](data:image/webp;base64,${image})\n\n## After the image\n\nThis text should remain below the image.\n\n[An ordinary link](https://example.com).`;
  const article = await prisma.article.upsert({ where: { slug: "local-image-test" }, update: process.env.RESET_REVIEW_SAMPLE === "1" ? { content } : {}, create: { title: "Local image placement test", slug: "local-image-test", excerpt: "A sample article for reviewing inline images and reader messages.", content, published: true } });
  await prisma.article.upsert({ where: { slug: "private-review-draft" }, update: {}, create: { title: "Private review draft", slug: "private-review-draft", excerpt: "Only admins should be able to retrieve this.", content: "This draft must never be returned to unauthenticated readers.", published: false } });
  const sub = await prisma.subscriber.upsert({ where: { email: "sample-reader@example.com" }, update: {}, create: { email: "sample-reader@example.com", unsubscribeToken: randomUUID() } });
  await prisma.interaction.upsert({ where: { kind_sourceId: { kind: "subscription", sourceId: String(sub.id) } }, update: {}, create: { kind: "subscription", sourceId: String(sub.id), email: sub.email, createdAt: sub.createdAt } });
  if (!await prisma.notificationJob.count()) await prisma.notificationJob.create({ data: { subscriberEmail: sub.email, signupAt: sub.createdAt } });
  if (!await prisma.comment.count({ where: { articleId: article.id } })) {
    const c = await prisma.comment.create({ data: { articleId: article.id, name: "Sample reader", body: "A local test message. No production data is used." } });
    await prisma.interaction.create({ data: { kind: "comment", sourceId: String(c.id), name: c.name, articleId: article.id } });
    await prisma.interaction.create({ data: { kind: "contact", sourceId: randomUUID(), name: "Sample contact", email: "sample-contact@example.com" } });
  }
  if (!await prisma.pageView.count()) {
    for (let days = 6; days >= 0; days--) {
      const at = new Date(); at.setUTCDate(at.getUTCDate() - days); at.setUTCHours(12, 0, 0, 0);
      const day = new Date(at); day.setUTCHours(0, 0, 0, 0);
      await prisma.pageView.createMany({ data: Array.from({ length: 4 + (days * 3) % 9 }, (_, i) => ({ id: randomUUID(), path: i % 2 ? "/" : "/articles/local-image-test", device: i % 2 ? "mobile" : "desktop", referrerHost: i % 3 ? null : "google.com", day, createdAt: at })) });
    }
  }
  await processNotifications();
}
seed().finally(() => prisma.$disconnect());
