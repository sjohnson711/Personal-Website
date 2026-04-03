/**
 * Auth session guard tests — verifies robustness of the session check
 * across all protected routes, and documents missing security controls.
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
import { POST } from "@/app/api/articles/route";
import { PUT, DELETE } from "@/app/api/articles/[id]/route";

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPrisma = prisma.article as jest.Mocked<typeof prisma.article>;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(url, options);
}

const VALID_BODY = JSON.stringify({
  title: "T",
  slug: "t",
  excerpt: "E",
  content: "C",
});

const ARTICLE = {
  id: 1,
  title: "T",
  slug: "t",
  excerpt: "E",
  content: "C",
  published: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => jest.clearAllMocks());

// ---------------------------------------------------------------------------
// POST — session shape edge cases
// ---------------------------------------------------------------------------
describe("POST /api/articles — session guard robustness", () => {
  it("returns 401 when auth() returns null", async () => {
    mockAuth.mockResolvedValue(null as never);

    const res = await POST(
      makeRequest("http://localhost/api/articles", {
        method: "POST",
        body: VALID_BODY,
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(res.status).toBe(401);
  });

  it("returns 401 when session has user: null", async () => {
    mockAuth.mockResolvedValue({ user: null } as never);

    const res = await POST(
      makeRequest("http://localhost/api/articles", {
        method: "POST",
        body: VALID_BODY,
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(res.status).toBe(401);
  });

  it("returns 401 when session is an empty object with no user key", async () => {
    mockAuth.mockResolvedValue({} as never);

    const res = await POST(
      makeRequest("http://localhost/api/articles", {
        method: "POST",
        body: VALID_BODY,
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(res.status).toBe(401);
  });

  it("allows the request through when session has a valid user object", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } } as never);
    mockPrisma.findUnique.mockResolvedValue(null);
    mockPrisma.create.mockResolvedValue(ARTICLE);

    const res = await POST(
      makeRequest("http://localhost/api/articles", {
        method: "POST",
        body: VALID_BODY,
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// PUT — session shape edge cases
// ---------------------------------------------------------------------------
describe("PUT /api/articles/[id] — session guard robustness", () => {
  it("returns 401 when auth() returns null", async () => {
    mockAuth.mockResolvedValue(null as never);

    const res = await PUT(
      makeRequest("http://localhost/api/articles/1", {
        method: "PUT",
        body: VALID_BODY,
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(res.status).toBe(401);
  });

  it("returns 401 when session has user: null", async () => {
    mockAuth.mockResolvedValue({ user: null } as never);

    const res = await PUT(
      makeRequest("http://localhost/api/articles/1", {
        method: "PUT",
        body: VALID_BODY,
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(res.status).toBe(401);
  });

  it("returns 401 when session is an empty object with no user key", async () => {
    mockAuth.mockResolvedValue({} as never);

    const res = await PUT(
      makeRequest("http://localhost/api/articles/1", {
        method: "PUT",
        body: VALID_BODY,
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// DELETE — session shape edge cases
// ---------------------------------------------------------------------------
describe("DELETE /api/articles/[id] — session guard robustness", () => {
  it("returns 401 when auth() returns null", async () => {
    mockAuth.mockResolvedValue(null as never);

    const res = await DELETE(
      makeRequest("http://localhost/api/articles/1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(res.status).toBe(401);
  });

  it("returns 401 when session has user: null", async () => {
    mockAuth.mockResolvedValue({ user: null } as never);

    const res = await DELETE(
      makeRequest("http://localhost/api/articles/1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(res.status).toBe(401);
  });

  it("returns 401 when session is an empty object with no user key", async () => {
    mockAuth.mockResolvedValue({} as never);

    const res = await DELETE(
      makeRequest("http://localhost/api/articles/1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(res.status).toBe(401);
  });

  it("allows delete when session has a valid user", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } } as never);
    mockPrisma.findUnique.mockResolvedValue(ARTICLE);
    mockPrisma.delete.mockResolvedValue(ARTICLE);

    const res = await DELETE(
      makeRequest("http://localhost/api/articles/1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Rate limiting — documented gap
// ---------------------------------------------------------------------------
describe("Auth — missing rate limiting (documented gap)", () => {
  /**
   * SECURITY GAP: The login endpoint has no rate limiting. A brute-force
   * attack can enumerate passwords without throttling.
   *
   * Recommended fix: add Next.js Edge Middleware that tracks failed attempts
   * per IP and returns 429 after N failures within a time window.
   *
   * Replace this placeholder with a real assertion once middleware is added.
   */
  it("documents that no rate-limit middleware is currently applied to auth", () => {
    // TODO: once rate limiting is added, mock 10 rapid failed login attempts
    // and assert the 11th returns 429 Too Many Requests.
    expect(true).toBe(true);
  });
});
