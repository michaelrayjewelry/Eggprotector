import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/assets/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      collectionItems: { include: { collection: true } },
      postAssets: {
        include: { post: { select: { id: true, text: true, status: true, postedAt: true } } },
        orderBy: { post: { createdAt: "desc" } },
        take: 10,
      },
    },
  });

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...asset,
    tags: asset.tags.map((at) => ({
      id: at.tag.id,
      slug: at.tag.slug,
      label: at.tag.label,
    })),
    collections: asset.collectionItems.map((ci) => ({
      id: ci.collection.id,
      name: ci.collection.name,
    })),
    recentPosts: asset.postAssets.map((pa) => pa.post),
  });
}

// PATCH /api/assets/:id — update title, alt_text, status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { title, altText, status } = body;

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (altText !== undefined) data.altText = altText;
  if (status !== undefined) data.status = status;

  const asset = await prisma.asset.update({
    where: { id },
    data,
    include: { tags: { include: { tag: true } } },
  });

  return NextResponse.json({
    ...asset,
    tags: asset.tags.map((at) => ({
      id: at.tag.id,
      slug: at.tag.slug,
      label: at.tag.label,
    })),
  });
}

// DELETE /api/assets/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.asset.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });

  return NextResponse.json({ success: true });
}
