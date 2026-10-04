import { Router } from "express";
import { prisma } from "../lib/prisma";
import { getTotalPages } from "../lib/pagination";
import { requireAuth, getOptionalAuth } from "../middleware/requireAuth";
import { notifySubscribers } from "../lib/email";
import { asyncHandler } from "../lib/asyncHandler";
import { articleSchema, validate, positiveId } from "../lib/validation";

const router = Router();
router.get("/", asyncHandler(async (req, res) => {
  const isAdmin = req.query.admin === "true" && getOptionalAuth(req);
  const rawPage = req.query.page ?? "1";
  if (typeof rawPage !== "string" || !/^[1-9]\d{0,5}$/.test(rawPage)) { res.status(400).json({ error: "Invalid page" }); return; }
  const page = Number(rawPage);
  const where = isAdmin ? {} : { published: true as const };
  const [articles, total] = await prisma.$transaction([
    prisma.article.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 7, take: 7 }),
    prisma.article.count({ where }),
  ]);
  res.json({ articles, total, page, totalPages: getTotalPages(total) });
}));
router.get("/:id", asyncHandler(async (req, res) => {
  const id = positiveId(req.params.id);
  const article = await prisma.article.findUnique({ where: id ? { id } : { slug: req.params.id } });
  if (!article || (!article.published && !getOptionalAuth(req))) { res.status(404).json({ error: "Not found" }); return; }
  res.json(article);
}));
router.post("/", requireAuth, validate(articleSchema), asyncHandler(async (req, res) => {
  const article = await prisma.article.create({ data: { ...req.body, published: req.body.published ?? false } });
  res.status(201).json(article);
  if (article.published) void notifySubscribers(article).catch(() => console.error("[newsletter] Publication email failed"));
}));
router.put("/:id", requireAuth, validate(articleSchema), asyncHandler(async (req, res) => {
  const id = positiveId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  const updated = await prisma.article.update({ where: { id }, data: { ...req.body, published: req.body.published ?? existing.published } });
  res.json(updated);
  if (!existing.published && updated.published) void notifySubscribers(updated).catch(() => console.error("[newsletter] Publication email failed"));
}));
router.delete("/:id", requireAuth, asyncHandler(async (req, res) => {
  const id = positiveId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  await prisma.$transaction([
    prisma.interaction.deleteMany({ where: { articleId: id } }),
    prisma.article.delete({ where: { id } }),
  ]);
  res.json({ success: true });
}));
export default router;
