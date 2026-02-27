import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/posts/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const post = await prisma.postLog.findUnique({
    where: { id },
    include: {
      postAssets: { include: { asset: { include: { tags: { include: { tag: true } } } } } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ post });
}

// PATCH /api/posts/:id — update text or swap asset
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
  const { text, assetIds } = body;

  const data: Record<string, unknown> = {};
  if (text !== undefined) data.text = text;

  const post = await prisma.postLog.update({
    where: { id },
    data,
  });

  // Update assets if provided
  if (assetIds !== undefined) {
    await prisma.postAsset.deleteMany({ where: { postId: id } });
    if (assetIds.length > 0) {
      await prisma.postAsset.createMany({
        data: assetIds.map((assetId: string) => ({ postId: id, assetId })),
      });
    }
  }

  return NextResponse.json({ post });
}

// DELETE /api/posts/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const post = await prisma.postLog.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  if (post.status === "POSTED") {
    return NextResponse.json(
      { error: "Cannot delete a posted tweet" },
      { status: 400 }
    );
  }

  await prisma.postLog.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
