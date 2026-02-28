import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { normalizeTagSlug, normalizeTagLabel } from "@/lib/tags";

// GET /api/tags — list all tags with usage counts
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const tags = await prisma.tag.findMany({
    include: { _count: { select: { assets: true } } },
    orderBy: { slug: "asc" },
  });

  return NextResponse.json({
    tags: tags.map((t) => ({
      id: t.id,
      slug: t.slug,
      label: t.label,
      assetCount: t._count.assets,
      createdAt: t.createdAt,
    })),
  });
}

// POST /api/tags — create a new tag
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { label } = body;
  if (!label || typeof label !== "string") {
    return NextResponse.json({ error: "Label is required" }, { status: 400 });
  }

  const slug = normalizeTagSlug(label);
  if (!slug) {
    return NextResponse.json({ error: "Invalid tag label" }, { status: 400 });
  }

  const existing = await prisma.tag.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: "Tag already exists", tag: existing },
      { status: 409 }
    );
  }

  const tag = await prisma.tag.create({
    data: { slug, label: normalizeTagLabel(label) },
  });

  return NextResponse.json({ tag }, { status: 201 });
}
