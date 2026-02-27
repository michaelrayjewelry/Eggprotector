import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { saveUploadedFile, getImageDimensions, getMimeType } from "@/lib/upload";
import { normalizeTagSlug, normalizeTagLabel } from "@/lib/tags";
import { Prisma } from "@/generated/prisma/client";

// GET /api/assets — search and list assets
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = req.nextUrl;
  const query = url.searchParams.get("query") || "";
  const tags = url.searchParams.get("tags")?.split(",").filter(Boolean) || [];
  const orientation = url.searchParams.get("orientation");
  const unusedDays = url.searchParams.get("unused_days");
  const status = url.searchParams.get("status") || "ACTIVE";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const where: Prisma.AssetWhereInput = {};

  if (status) {
    where.status = status as "ACTIVE" | "ARCHIVED";
  }

  if (query) {
    where.title = { contains: query, mode: "insensitive" };
  }

  if (tags.length > 0) {
    where.tags = {
      some: { tag: { slug: { in: tags } } },
    };
  }

  if (unusedDays) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(unusedDays));
    where.OR = [
      { lastUsedAt: null },
      { lastUsedAt: { lt: cutoff } },
    ];
  }

  let assets = await prisma.asset.findMany({
    where,
    include: {
      tags: { include: { tag: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  // Filter orientation in app code
  if (orientation) {
    assets = assets.filter((a) => {
      if (!a.width || !a.height) return true;
      switch (orientation) {
        case "landscape":
          return a.width > a.height;
        case "portrait":
          return a.height > a.width;
        case "square":
          return Math.abs(a.width - a.height) < a.width * 0.1;
        default:
          return true;
      }
    });
  }

  const total = await prisma.asset.count({ where });

  return NextResponse.json({
    assets: assets.map((a) => ({
      ...a,
      tags: a.tags.map((at) => ({
        id: at.tag.id,
        slug: at.tag.slug,
        label: at.tag.label,
      })),
    })),
    total,
    limit,
    offset,
  });
}

// POST /api/assets — upload a new asset
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "";
    const altText = (formData.get("alt_text") as string) || null;
    const tagsRaw = (formData.get("tags") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = getMimeType(file.name);

    if (!mimeType.startsWith("image/") && !mimeType.startsWith("video/")) {
      return NextResponse.json(
        { error: "Only image and video files are allowed" },
        { status: 400 }
      );
    }

    // Save file and compute hash
    const { storageKey, sha256, sizeBytes } = await saveUploadedFile(
      buffer,
      file.name
    );

    // Check for duplicate
    const existing = await prisma.asset.findUnique({ where: { sha256 } });
    if (existing) {
      return NextResponse.json(
        { error: "Duplicate file already exists", existingId: existing.id },
        { status: 409 }
      );
    }

    // Get dimensions
    const dimensions = getImageDimensions(buffer);

    // Parse and normalize tags
    const tagSlugs = tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .map(normalizeTagSlug);

    // Upsert tags
    const tagRecords = await Promise.all(
      tagSlugs.map(async (slug) => {
        return prisma.tag.upsert({
          where: { slug },
          create: { slug, label: normalizeTagLabel(slug.replace(/-/g, " ")) },
          update: {},
        });
      })
    );

    // Create asset
    const asset = await prisma.asset.create({
      data: {
        type: mimeType.startsWith("video/") ? "VIDEO" : "IMAGE",
        storageKey,
        originalFilename: file.name,
        title: title || file.name.replace(/\.[^.]+$/, ""),
        altText,
        mimeType,
        sizeBytes,
        width: dimensions?.width ?? null,
        height: dimensions?.height ?? null,
        sha256,
        createdById: user.id,
        tags: {
          create: tagRecords.map((t) => ({ tagId: t.id })),
        },
      },
      include: {
        tags: { include: { tag: true } },
      },
    });

    return NextResponse.json(
      {
        ...asset,
        tags: asset.tags.map((at) => ({
          id: at.tag.id,
          slug: at.tag.slug,
          label: at.tag.label,
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
