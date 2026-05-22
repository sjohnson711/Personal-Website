import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

// bad-words v3 is CommonJS and ships no types; declare the minimal surface we use.
type BadWordsCtor = new () => { isProfane(input: string): boolean };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Filter: BadWordsCtor = require("bad-words");
const profanityFilter = new Filter();

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

    if (profanityFilter.isProfane(name) || profanityFilter.isProfane(body)) {
      res.status(400).json({
        error:
          "Please keep messages respectful. Your comment contains language that isn't allowed.",
      });
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

// DELETE /api/comments/:id — admin-only, remove a single comment
router.delete(
  "/:id",
  requireAuth,
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid comment ID" });
      return;
    }

    const existing = await prisma.comment.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }

    await prisma.comment.delete({ where: { id } });
    res.json({ success: true });
  },
);

export default router;
