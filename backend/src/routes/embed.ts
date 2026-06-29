import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { resolveEmbed, normalizeUrl, EmbedError, EmbedResult } from "../lib/embed";

const router = Router();

const MAX_URL_LENGTH = 2048;
const SUCCESS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const NEGATIVE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Abuse control. Cache hits are cheap (no outbound fetch) so don't count them.
const limiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
router.use(limiter);

function isFresh(fetchedAt: Date, ok: boolean): boolean {
  const age = Date.now() - fetchedAt.getTime();
  return age < (ok ? SUCCESS_TTL_MS : NEGATIVE_TTL_MS);
}

function toResult(row: {
  type: string;
  title: string | null;
  description: string | null;
  image: string | null;
  provider: string | null;
  embedHtml: string | null;
}): EmbedResult {
  return {
    type: row.type === "video" ? "video" : "card",
    title: row.title,
    description: row.description,
    image: row.image,
    provider: row.provider,
    embedHtml: row.embedHtml,
  };
}

// GET /api/embed?url=...
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const raw = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  if (typeof raw !== "string" || raw.length === 0 || raw.length > MAX_URL_LENGTH) {
    res.status(400).json({ error: "Invalid or missing url" });
    return;
  }

  let url: string;
  try {
    url = normalizeUrl(raw);
  } catch {
    res.status(400).json({ error: "Invalid url" });
    return;
  }

  // Cache lookup.
  const cached = await prisma.embedCache.findUnique({ where: { url } });
  if (cached && isFresh(cached.fetchedAt, cached.ok)) {
    if (!cached.ok) {
      res.status(400).json({ error: "Unable to embed this URL" });
      return;
    }
    res.set("Cache-Control", "public, max-age=86400");
    res.json(toResult(cached));
    return;
  }

  try {
    const result = await resolveEmbed(url);
    await prisma.embedCache.upsert({
      where: { url },
      create: {
        url,
        type: result.type,
        title: result.title ?? null,
        description: result.description ?? null,
        image: result.image ?? null,
        provider: result.provider ?? null,
        embedHtml: result.embedHtml ?? null,
        ok: true,
      },
      update: {
        type: result.type,
        title: result.title ?? null,
        description: result.description ?? null,
        image: result.image ?? null,
        provider: result.provider ?? null,
        embedHtml: result.embedHtml ?? null,
        ok: true,
        fetchedAt: new Date(),
      },
    });
    res.set("Cache-Control", "public, max-age=86400");
    res.json(result);
  } catch (err) {
    // Policy violation (invalid/blocked) → negative-cache + 400. Serve stale
    // success data if we have it rather than failing a previously-good URL.
    if (err instanceof EmbedError) {
      if (cached?.ok) {
        res.set("Cache-Control", "public, max-age=86400");
        res.json(toResult(cached));
        return;
      }
      await prisma.embedCache.upsert({
        where: { url },
        create: { url, type: "card", ok: false },
        update: { ok: false, fetchedAt: new Date() },
      });
      res.status(400).json({ error: err.message });
      return;
    }
    // Unexpected error — don't break the reader's page.
    res.status(502).json({ error: "Failed to resolve embed" });
  }
});

export default router;
