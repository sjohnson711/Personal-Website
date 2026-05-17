import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { getPaginationParams, getTotalPages } from "../lib/pagination";
import {
  requireAuth,
  getOptionalAuth,
  AuthRequest,
} from "../middleware/requireAuth";
import { notifySubscribers } from "../lib/email";

const router = Router();

// GET /api/articles
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const adminParam = Array.isArray(req.query.admin) ? req.query.admin[0] : req.query.admin;
  const adminMode = adminParam === "true";
  const isAdmin = adminMode && getOptionalAuth(req);

  const pageParam = Array.isArray(req.query.page) ? req.query.page[0] : req.query.page;
  const { page, skip, take } = getPaginationParams({
    page: pageParam as string,
  });

  const whereClause = isAdmin ? {} : { published: true as const };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.article.count({ where: whereClause }),
  ]);

  res.json({ articles, total, page, totalPages: getTotalPages(total) });
});

// GET /api/articles/:id  (accepts numeric id or slug)
router.get(
  "/:id",
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const { id } = req.params;
    const numericId = parseInt(id, 10);

    const article = isNaN(numericId)
      ? await prisma.article.findUnique({ where: { slug: id } })
      : await prisma.article.findUnique({ where: { id: numericId } });

    if (!article) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json(article);
  },
);

// POST /api/articles  (auth required)
router.post(
  "/",
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { title, slug, excerpt, content, published } = req.body;

    if (!title || !slug || !excerpt || !content) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const existing = await prisma.article.findUnique({ where: { slug } });
    if (existing) {
      res.status(409).json({ error: "Slug already exists" });
      return;
    }

    const article = await prisma.article.create({
      data: { title, slug, excerpt, content, published: published ?? false },
    });

    res.status(201).json(article);
    if (article.published) {
      notifySubscribers(article);
    }
  },
);

// PUT /api/articles/:id  (auth required)
router.put(
  "/:id",
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const numericId = parseInt(req.params.id as string, 10);
    if (isNaN(numericId)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const { title, slug, excerpt, content, published } = req.body;

    if (!title || !slug || !excerpt || !content) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const existing = await prisma.article.findUnique({
      where: { id: numericId },
    });
    if (!existing) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const updated = await prisma.article.update({
      where: { id: numericId },
      data: {
        title,
        slug,
        excerpt,
        content,
        published: published ?? existing.published,
      },
    });

    res.json(updated);
    if (!existing.published && updated.published) {
      notifySubscribers(updated);
    }
  },
);

// DELETE /api/articles/:id  (auth required)
router.delete(
  "/:id",
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const numericId = parseInt(req.params.id as string, 10);
    if (isNaN(numericId)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const existing = await prisma.article.findUnique({
      where: { id: numericId },
    });
    if (!existing) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    await prisma.article.delete({ where: { id: numericId } });

    res.json({ success: true });
  },
);

export default router;
