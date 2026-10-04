import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { validate } from "../lib/validation";
import { requireAuth } from "../middleware/requireAuth";
import { limiter } from "../middleware/security";

const router = Router();
const viewSchema = z.object({
  id: z.string().uuid(), path: z.string().max(512),
  referrerHost: z.string().max(253).regex(/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/).nullable(),
  device: z.enum(["desktop", "mobile", "tablet", "unknown"]),
}).strict();
router.post("/pageviews", limiter(120, 60_000), validate(viewSchema), asyncHandler(async (req, res) => {
  if (req.get("DNT") === "1" || req.get("Sec-GPC") === "1") { res.status(204).end(); return; }
  const { id, path, referrerHost, device } = req.body;
  const fixed = ["/", "/about", "/articles", "/gateway", "/privacy"];
  if (!fixed.includes(path)) {
    const match = /^\/articles\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(path);
    if (!match || !await prisma.article.findFirst({ where: { slug: match[1], published: true }, select: { id: true } })) {
      res.status(400).json({ error: "Unknown public page" }); return;
    }
  }
  const now = new Date();
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  // The UUID identifies one event, never a person or a browser. Retries deduplicate.
  await prisma.pageView.createMany({ data: [{ id, path, referrerHost, device, day }], skipDuplicates: true });
  res.status(204).end();
}));
router.use(requireAuth);

function range(raw: unknown): number | null {
  return raw === undefined ? 30 : typeof raw === "string" && ["7", "30", "90"].includes(raw) ? Number(raw) : null;
}
function since(days: number): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days + 1);
  return date;
}
function pageNumber(raw: unknown): number | null {
  if (raw === undefined) return 1;
  return typeof raw === "string" && /^[1-9]\d{0,5}$/.test(raw) ? Number(raw) : null;
}

router.get("/summary", asyncHandler(async (req, res) => {
  const days = range(req.query.days);
  if (!days) { res.status(400).json({ error: "Choose 7, 30, or 90 days" }); return; }
  const where = { createdAt: { gte: since(days) } };
  const [views, daily, paths, sources, devices, interactions, articles, first] = await Promise.all([
    prisma.pageView.count({ where }),
    prisma.pageView.groupBy({ by: ["day"], where, _count: { _all: true }, orderBy: { day: "asc" } }),
    prisma.pageView.groupBy({ by: ["path"], where, _count: { _all: true }, orderBy: { _count: { path: "desc" } }, take: 10 }),
    prisma.pageView.groupBy({ by: ["referrerHost"], where, _count: { _all: true }, orderBy: { referrerHost: "asc" } }),
    prisma.pageView.groupBy({ by: ["device"], where, _count: { _all: true }, orderBy: { device: "asc" } }),
    prisma.interaction.groupBy({ by: ["kind"], where, _count: { _all: true }, orderBy: { kind: "asc" } }),
    prisma.article.findMany({ where: { published: true }, select: { title: true, slug: true } }),
    prisma.pageView.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
  ]);
  const counts = Object.fromEntries(interactions.map((row) => [row.kind, row._count._all]));
  const byDay = new Map(daily.map((row) => [row.day.toISOString().slice(0, 10), row._count._all]));
  const start = since(days);
  res.json({ days, totals: { views, subscriptions: counts.subscription ?? 0, comments: counts.comment ?? 0, contacts: counts.contact ?? 0 },
    trackingSince: first?.createdAt ?? null,
    daily: Array.from({ length: days }, (_, i) => { const date = new Date(start); date.setUTCDate(date.getUTCDate() + i); const day = date.toISOString().slice(0, 10); return { day, views: byDay.get(day) ?? 0 }; }),
    popularPages: paths.map((row) => ({ path: row.path, title: articles.find((a) => row.path === `/articles/${a.slug}`)?.title ?? row.path, views: row._count._all })),
    sources: sources.map((row) => ({ source: row.referrerHost ?? "Direct / internal / unavailable", views: row._count._all })).sort((a, b) => b.views - a.views).slice(0, 10),
    devices: devices.map((row) => ({ device: row.device, views: row._count._all })),
  });
}));
router.get("/activity", asyncHandler(async (req, res) => {
  const days = range(req.query.days), page = pageNumber(req.query.page);
  if (!days || !page) { res.status(400).json({ error: "Invalid range or page" }); return; }
  const where = { createdAt: { gte: since(days) } };
  const [items, total] = await prisma.$transaction([
    prisma.interaction.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 20, take: 20,
      select: { id: true, kind: true, name: true, email: true, articleId: true, createdAt: true } }),
    prisma.interaction.count({ where }),
  ]);
  res.json({ items, total, page, totalPages: Math.ceil(total / 20) });
}));
router.get("/subscribers", asyncHandler(async (req, res) => {
  const page = pageNumber(req.query.page);
  if (!page) { res.status(400).json({ error: "Invalid page" }); return; }
  const [items, total] = await prisma.$transaction([
    prisma.subscriber.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * 20, take: 20, select: { id: true, email: true, createdAt: true } }),
    prisma.subscriber.count(),
  ]);
  res.json({ items, total, page, totalPages: Math.ceil(total / 20) });
}));
router.get("/notifications", asyncHandler(async (_req, res) => {
  const items = await prisma.notificationJob.findMany({ where: { createdAt: { gte: since(90) } }, orderBy: { createdAt: "desc" }, take: 20,
    select: { id: true, subscriberEmail: true, status: true, attempts: true, signupAt: true, sentAt: true, lastError: true } });
  res.json({ items });
}));
export default router;
