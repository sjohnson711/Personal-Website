/**
 * Unit tests for article API route logic.
 * The Prisma client and auth are mocked so no real DB is needed.
 */

// Mock auth
jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

// Mock Prisma
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
import {
  GET as GET_ONE,
  PUT,
  DELETE,
} from "@/app/api/articles/[id]/route";

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPrisma = prisma.article as jest.Mocked<typeof prisma.article>;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(url, options);
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// GET /api/articles
// ---------------------------------------------------------------------------
describe("GET /api/articles", () => {
  it("returns paginated published articles", async () => {
    const articles = [
      {
        id: 1,
        title: "Test Article",
        slug: "test-article",
        excerpt: "Excerpt",
        content: "Content",
        published: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockPrisma.findMany.mockResolvedValue(articles);
    mockPrisma.count.mockResolvedValue(1);

    const req = makeRequest("http://localhost/api/articles?page=1");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.articles).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(json.page).toBe(1);
    expect(json.totalPages).toBe(1);
  });

  it("defaults to page 1 when no page param", async () => {
    mockPrisma.findMany.mockResolvedValue([]);
    mockPrisma.count.mockResolvedValue(0);

    const req = makeRequest("http://localhost/api/articles");
    const res = await GET(req);
    const json = await res.json();

    expect(json.page).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// POST /api/articles
// ---------------------------------------------------------------------------
describe("POST /api/articles", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as never);

    const req = makeRequest("http://localhost/api/articles", {
      method: "POST",
      body: JSON.stringify({ title: "T", slug: "t", excerpt: "E", content: "C" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when required fields are missing", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } } as never);

    const req = makeRequest("http://localhost/api/articles", {
      method: "POST",
      body: JSON.stringify({ title: "Only title" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 409 when slug already exists", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } } as never);
    mockPrisma.findUnique.mockResolvedValue({
      id: 1,
      title: "Existing",
      slug: "existing",
      excerpt: "E",
      content: "C",
      published: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = makeRequest("http://localhost/api/articles", {
      method: "POST",
      body: JSON.stringify({ title: "New", slug: "existing", excerpt: "E", content: "C" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it("creates an article and returns 201", async () => {
    const created = {
      id: 2,
      title: "New Article",
      slug: "new-article",
      excerpt: "Excerpt",
      content: "Content",
      published: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } } as never);
    mockPrisma.findUnique.mockResolvedValue(null);
    mockPrisma.create.mockResolvedValue(created);

    const req = makeRequest("http://localhost/api/articles", {
      method: "POST",
      body: JSON.stringify({
        title: "New Article",
        slug: "new-article",
        excerpt: "Excerpt",
        content: "Content",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.slug).toBe("new-article");
  });
});

// ---------------------------------------------------------------------------
// GET /api/articles/[id]
// ---------------------------------------------------------------------------
describe("GET /api/articles/[id]", () => {
  it("returns 404 for nonexistent article", async () => {
    mockPrisma.findUnique.mockResolvedValue(null);

    const req = makeRequest("http://localhost/api/articles/999");
    const res = await GET_ONE(req, { params: Promise.resolve({ id: "999" }) });

    expect(res.status).toBe(404);
  });

  it("returns the article when found by ID", async () => {
    const article = {
      id: 1,
      title: "Found",
      slug: "found",
      excerpt: "E",
      content: "C",
      published: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockPrisma.findUnique.mockResolvedValue(article);

    const req = makeRequest("http://localhost/api/articles/1");
    const res = await GET_ONE(req, { params: Promise.resolve({ id: "1" }) });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.title).toBe("Found");
  });
});

// ---------------------------------------------------------------------------
// PUT /api/articles/[id]
// ---------------------------------------------------------------------------
describe("PUT /api/articles/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as never);

    const req = makeRequest("http://localhost/api/articles/1", {
      method: "PUT",
      body: JSON.stringify({ title: "T", slug: "t", excerpt: "E", content: "C" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PUT(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 when article does not exist", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } } as never);
    mockPrisma.findUnique.mockResolvedValue(null);

    const req = makeRequest("http://localhost/api/articles/99", {
      method: "PUT",
      body: JSON.stringify({ title: "T", slug: "t", excerpt: "E", content: "C" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PUT(req, { params: Promise.resolve({ id: "99" }) });
    expect(res.status).toBe(404);
  });

  it("updates the article and returns 200", async () => {
    const existing = {
      id: 1, title: "Old", slug: "old", excerpt: "E", content: "C",
      published: true, createdAt: new Date(), updatedAt: new Date(),
    };
    const updated = { ...existing, title: "New Title", slug: "new-title" };

    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } } as never);
    mockPrisma.findUnique.mockResolvedValue(existing);
    mockPrisma.update.mockResolvedValue(updated);

    const req = makeRequest("http://localhost/api/articles/1", {
      method: "PUT",
      body: JSON.stringify({ title: "New Title", slug: "new-title", excerpt: "E", content: "C" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PUT(req, { params: Promise.resolve({ id: "1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.title).toBe("New Title");
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/articles/[id]
// ---------------------------------------------------------------------------
describe("DELETE /api/articles/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as never);

    const req = makeRequest("http://localhost/api/articles/1", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });

    expect(res.status).toBe(401);
  });

  it("returns 404 when article does not exist", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } } as never);
    mockPrisma.findUnique.mockResolvedValue(null);

    const req = makeRequest("http://localhost/api/articles/99", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "99" }) });

    expect(res.status).toBe(404);
  });

  it("deletes the article and returns success", async () => {
    const article = {
      id: 1, title: "Delete Me", slug: "delete-me", excerpt: "E",
      content: "C", published: true, createdAt: new Date(), updatedAt: new Date(),
    };

    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } } as never);
    mockPrisma.findUnique.mockResolvedValue(article);
    mockPrisma.delete.mockResolvedValue(article);

    const req = makeRequest("http://localhost/api/articles/1", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });
});
