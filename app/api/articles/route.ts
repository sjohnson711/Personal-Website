import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPaginationParams, getTotalPages } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page") ?? "1";
  // Pass ?admin=true to include drafts (requires valid session)
  const adminMode = searchParams.get("admin") === "true";

  const session = adminMode ? await auth() : null;
  const isAdmin = !!session?.user;

  const { page, skip, take } = getPaginationParams({ page: pageParam });

  // Unauthenticated requests only see published articles
  const whereClause = isAdmin ? {} : { published: true };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.article.count({ where: whereClause }),
  ]);

  return NextResponse.json({
    articles,
    total,
    page,
    totalPages: getTotalPages(total),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, slug, excerpt, content, published } = body;

  if (!title?.trim() || !slug?.trim() || !excerpt?.trim() || !content?.trim()) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const existing = await prisma.article.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  const article = await prisma.article.create({
    data: { title, slug, excerpt, content, published: published ?? false },
  });

  return NextResponse.json(article, { status: 201 });
}
