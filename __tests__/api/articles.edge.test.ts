/**
 * Edge-case tests for the articles API.
 *
 * KEY FINDINGS DOCUMENTED HERE:
 *  1. Draft articles are readable without auth via GET /api/articles/[id]
 *  2. PUT /api/articles/[id] has no slug-collision check across different articles
 *  3. Whitespace-only strings bypass the current truthiness validation on POST/PUT
 */

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    article: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/articles/route";
import { GET as GET_ONE, PUT, DELETE } from "@/app/api/articles/[id]/route";

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPrisma = prisma.article as jest.Mocked<typeof prisma.article>;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(url, options);
}

const DRAFT_ARTICLE = {
  id: 5,
  title: "Secret Draft",
  slug: "secret-draft",
  excerpt: "Not ready",
  content: "WIP",
  published: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const PUBLISHED_ARTICLE = {
  id: 1,
  title: "Published",
  slug: "published",
  excerpt: "Live",
  content: "Content",
  published: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => jest.clearAllMocks());

// ---------------------------------------------------------------------------
// GET /api/articles — pagination boundaries
// ---------------------------------------------------------------------------
describe("GET /api/articles — pagination edge cases", () => {
  it("returns empty array when page exceeds total, totalPages still correct", async () => {
    mockPrisma.findMany.mockResolvedValue([]);
    mockPrisma.count.mockResolvedValue(7);

    const res = await GET(
      makeRequest("http://localhost/api/articles?page=9999"),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.articles).toHaveLength(0);
    expect(json.totalPages).toBe(1);
    expect(json.page).toBe(9999);
  });

  it("clamps page=0 to page 1", async () => {
    mockPrisma.findMany.mockResolvedValue([]);
    mockPrisma.count.mockResolvedValue(0);
    const json = await (
      await GET(makeRequest("http://localhost/api/articles?page=0"))
    ).json();
    expect(json.page).toBe(1);
  });

  it("clamps negative page to page 1", async () => {
    mockPrisma.findMany.mockResolvedValue([]);
    mockPrisma.count.mockResolvedValue(0);
    const json = await (
      await GET(makeRequest("http://localhost/api/articles?page=-10"))
    ).json();
    expect(json.page).toBe(1);
  });

  it("clamps non-numeric page to page 1", async () => {
    mockPrisma.findMany.mockResolvedValue([]);
    mockPrisma.count.mockResolvedValue(0);
    const json = await (
      await GET(makeRequest("http://localhost/api/articles?page=abc"))
    ).json();
    expect(json.page).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// GET /api/articles — admin mode auth degradation
// ---------------------------------------------------------------------------
describe("GET /api/articles — admin mode", () => {
  it("degrades to published-only when ?admin=true but no session", async () => {
    mockAuth.mockResolvedValue(null as never);
    mockPrisma.findMany.mockResolvedValue([PUBLISHED_ARTICLE]);
    mockPrisma.count.mockResolvedValue(1);

    await GET(makeRequest("http://localhost/api/articles?admin=true"));

    expect(mockPrisma.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { published: true } }),
    );
  });

  it("returns all articles including drafts when ?admin=true with valid session", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } } as never);
    mockPrisma.findMany.mockResolvedValue([PUBLISHED_ARTICLE, DRAFT_ARTICLE]);
    mockPrisma.count.mockResolvedValue(2);

    const json = await (
      await GET(makeRequest("http://localhost/api/articles?admin=true"))
    ).json();

    expect(json.articles).toHaveLength(2);
    expect(mockPrisma.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });
});

// ---------------------------------------------------------------------------
// GET /api/articles/[id] — SECURITY GAP: draft exposure
// ---------------------------------------------------------------------------
describe("GET /api/articles/[id] — draft exposure (security gap)", () => {
  /**
   * The current GET /:id handler returns draft articles to unauthenticated
   * callers who know the ID or slug. These tests document that behavior.
   * Fix: add an auth check and return 404 for drafts in app/api/articles/[id]/route.ts
   */
  it("returns a draft to an unauthenticated request by numeric ID", async () => {
    mockPrisma.findUnique.mockResolvedValue(DRAFT_ARTICLE);

    const res = await GET_ONE(makeRequest("http://localhost/api/articles/5"), {
      params: Promise.resolve({ id: "5" }),
    });

    // Documents current insecure behavior — should ideally return 404
    expect(res.status).toBe(200);
    expect((await res.json()).published).toBe(false);
  });

  it("returns a draft to an unauthenticated request by slug", async () => {
    mockPrisma.findUnique.mockResolvedValue(DRAFT_ARTICLE);

    const res = await GET_ONE(
      makeRequest("http://localhost/api/articles/secret-draft"),
      { params: Promise.resolve({ id: "secret-draft" }) },
    );

    expect(res.status).toBe(200);
    expect((await res.json()).published).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// GET /api/articles/[id] — slug-based lookup
// ---------------------------------------------------------------------------
describe("GET /api/articles/[id] — slug lookup", () => {
  it("finds article by slug and queries with where: { slug }", async () => {
    mockPrisma.findUnique.mockResolvedValue(PUBLISHED_ARTICLE);

    const res = await GET_ONE(
      makeRequest("http://localhost/api/articles/published"),
      { params: Promise.resolve({ id: "published" }) },
    );

    expect(res.status).toBe(200);
    expect(mockPrisma.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "published" } }),
    );
  });

  it("returns 404 for a slug that does not exist", async () => {
    mockPrisma.findUnique.mockResolvedValue(null);

    const res = await GET_ONE(
      makeRequest("http://localhost/api/articles/ghost"),
      { params: Promise.resolve({ id: "ghost" }) },
    );

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// POST /api/articles — whitespace-only field validation
// ---------------------------------------------------------------------------
describe("POST /api/articles — whitespace validation", () => {
  /**
   * VALIDATION GAP: !title is truthy for "   ". Fix by using !title?.trim().
   * These tests describe the CORRECT expected behavior (400 response).
   * They will FAIL until the validation is fixed in app/api/articles/route.ts.
   */
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } } as never);
    mockPrisma.findUnique.mockResolvedValue(null);
  });

  const cases = [
    {
      field: "title",
      body: { title: "   ", slug: "s", excerpt: "E", content: "C" },
    },
    {
      field: "slug",
      body: { title: "T", slug: "   ", excerpt: "E", content: "C" },
    },
    {
      field: "excerpt",
      body: { title: "T", slug: "s", excerpt: "   ", content: "C" },
    },
    {
      field: "content",
      body: { title: "T", slug: "s", excerpt: "E", content: "   " },
    },
  ];

  test.each(cases)(
    "rejects whitespace-only $field with 400",
    async ({ body }) => {
      const res = await POST(
        makeRequest("http://localhost/api/articles", {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        }),
      );
      expect(res.status).toBe(400);
    },
  );
});

// ---------------------------------------------------------------------------
// PUT /api/articles/[id] — validation edge cases
// ---------------------------------------------------------------------------
describe("PUT /api/articles/[id] — edge cases", () => {
  it("returns 400 for a non-numeric ID", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } } as never);

    const res = await PUT(
      makeRequest("http://localhost/api/articles/not-a-number", {
        method: "PUT",
        body: JSON.stringify({
          title: "T",
          slug: "t",
          excerpt: "E",
          content: "C",
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "not-a-number" }) },
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 when required fields are missing", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } } as never);
    mockPrisma.findUnique.mockResolvedValue(PUBLISHED_ARTICLE);

    const res = await PUT(
      makeRequest("http://localhost/api/articles/1", {
        method: "PUT",
        body: JSON.stringify({ title: "Only title" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(res.status).toBe(400);
  });

  /**
   * SECURITY GAP: No slug-collision check when updating to a slug already
   * owned by a different article. Will throw a Prisma unique constraint error
   * instead of a clean 409. This test documents the current (broken) behavior.
   * Fix: add a slug uniqueness check in app/api/articles/[id]/route.ts PUT handler.
   */
  it("does not check slug collision with a different article (documents gap)", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } } as never);
    mockPrisma.findUnique.mockResolvedValue(PUBLISHED_ARTICLE);
    mockPrisma.update.mockResolvedValue({
      ...PUBLISHED_ARTICLE,
      slug: "other-slug",
    });

    const res = await PUT(
      makeRequest("http://localhost/api/articles/1", {
        method: "PUT",
        body: JSON.stringify({
          title: "T",
          slug: "other-slug",
          excerpt: "E",
          content: "C",
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "1" }) },
    );

    // Currently 200 — no collision check. Expected correct behavior: 409.
    expect(res.status).toBe(200);
  });

  it("preserves existing published state when not provided in update", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } } as never);
    mockPrisma.findUnique.mockResolvedValue(PUBLISHED_ARTICLE);
    mockPrisma.update.mockResolvedValue(PUBLISHED_ARTICLE);

    await PUT(
      makeRequest("http://localhost/api/articles/1", {
        method: "PUT",
        body: JSON.stringify({
          title: "T",
          slug: "t",
          excerpt: "E",
          content: "C",
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(mockPrisma.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ published: true }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/articles/[id] — edge cases
// ---------------------------------------------------------------------------
describe("DELETE /api/articles/[id] — edge cases", () => {
  it("returns 400 for a non-numeric ID", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } } as never);

    const res = await DELETE(
      makeRequest("http://localhost/api/articles/not-a-number", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "not-a-number" }) },
    );

    expect(res.status).toBe(400);
  });

  it("returns 401 when session exists but has no user property", async () => {
    mockAuth.mockResolvedValue({} as never);

    const res = await DELETE(
      makeRequest("http://localhost/api/articles/1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(res.status).toBe(401);
  });
});
