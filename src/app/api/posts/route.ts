import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/posts — list posts with filters
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = req.nextUrl;
  const status = url.searchParams.get("status");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const where: Record<string, unknown> = {};
  if (status) {
    where.status = status;
  }

  const [posts, total] = await Promise.all([
    prisma.postLog.findMany({
      where,
      include: {
        postAssets: { include: { asset: { include: { tags: { include: { tag: true } } } } } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.postLog.count({ where }),
  ]);

  return NextResponse.json({
    posts: posts.map((p) => ({
      id: p.id,
      text: p.text,
      status: p.status,
      slot: p.slot,
      scheduledFor: p.scheduledFor,
      postedAt: p.postedAt,
      xTweetId: p.xTweetId,
      failureReason: p.failureReason,
      createdAt: p.createdAt,
      createdBy: p.createdBy,
      assets: p.postAssets.map((pa) => ({
        id: pa.asset.id,
        title: pa.asset.title,
        storageKey: pa.asset.storageKey,
        tags: pa.asset.tags.map((at) => at.tag.slug),
      })),
    })),
    total,
    limit,
    offset,
  });
}

// POST /api/posts — create a manual post draft
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { text, assetIds, scheduledFor } = body;

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  const post = await prisma.postLog.create({
    data: {
      text,
      status: "DRAFTED",
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      createdById: user.id,
      postAssets: assetIds?.length
        ? { create: assetIds.map((id: string) => ({ assetId: id })) }
        : undefined,
    },
    include: {
      postAssets: { include: { asset: true } },
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}
