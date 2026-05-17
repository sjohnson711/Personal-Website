import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /api/comments/:articleId — list all comments for an article
router.get(
  "/:articleId",
  async (req: Request<{ articleId: string }>, res: Response): Promise<void> => {
    const articleId = parseInt(req.params.articleId, 10);
    if (isNaN(articleId)) {
      res.status(400).json({ error: "Invalid article ID" });
      return;
    }

    const comments = await prisma.comment.findMany({
      where: { articleId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, body: true, createdAt: true },
    });

    res.json({ comments });
  },
);

// POST /api/comments/:articleId — submit a new comment
router.post(
  "/:articleId",
  async (req: Request<{ articleId: string }>, res: Response): Promise<void> => {
    const articleId = parseInt(req.params.articleId, 10);
    if (isNaN(articleId)) {
      res.status(400).json({ error: "Invalid article ID" });
      return;
    }

    const { name, body } = req.body as { name?: string; body?: string };

    if (!name?.trim() || !body?.trim()) {
      res.status(400).json({ error: "Name and message are required" });
      return;
    }

    if (name.trim().length > 100) {
      res.status(400).json({ error: "Name must be 100 characters or fewer" });
      return;
    }

    if (body.trim().length > 2000) {
      res
        .status(400)
        .json({ error: "Message must be 2000 characters or fewer" });
      return;
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });
    if (!article || !article.published) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    const comment = await prisma.comment.create({
      data: { articleId, name: name.trim(), body: body.trim() },
      select: { id: true, name: true, body: true, createdAt: true },
    });

    res.status(201).json(comment);
  },
);

export default router;
