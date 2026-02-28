import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { normalizeTagSlug, normalizeTagLabel } from "@/lib/tags";

// PUT /api/assets/:id/tags — replace all tags on an asset
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const rawTags: string[] = body.tags || [];

  const slugs = rawTags.map(normalizeTagSlug).filter(Boolean);

  // Upsert all tags
  const tagRecords = await Promise.all(
    slugs.map((slug) =>
      prisma.tag.upsert({
        where: { slug },
        create: { slug, label: normalizeTagLabel(slug.replace(/-/g, " ")) },
        update: {},
      })
    )
  );

  // Delete existing asset_tags and recreate
  await prisma.assetTag.deleteMany({ where: { assetId: id } });
  await prisma.assetTag.createMany({
    data: tagRecords.map((t) => ({ assetId: id, tagId: t.id })),
  });

  // Return updated asset
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: { tags: { include: { tag: true } } },
  });

  return NextResponse.json({
    ...asset,
    tags: asset!.tags.map((at) => ({
      id: at.tag.id,
      slug: at.tag.slug,
      label: at.tag.label,
    })),
  });
}
