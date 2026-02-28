import prisma from "./prisma";
import { getPolicy } from "./policy";
import { Prisma } from "@/generated/prisma/client";

interface SelectAssetInput {
  intent?: string;
  required_tags?: string[];
  preferred_tags?: string[];
  constraints?: {
    orientation?: "landscape" | "portrait" | "square";
    min_width?: number;
    exclude_recent_days?: number;
    exclude_asset_ids?: string[];
  };
}

export async function selectAsset(input: SelectAssetInput) {
  const policy = await getPolicy();
  const cooldownDays =
    input.constraints?.exclude_recent_days ??
    policy.image_reuse_cooldown_days;
  const cooldownDate = new Date();
  cooldownDate.setDate(cooldownDate.getDate() - cooldownDays);

  const where: Prisma.AssetWhereInput = {
    status: "ACTIVE",
    type: "IMAGE",
  };

  // Exclude recently used
  where.OR = [
    { lastUsedAt: null },
    { lastUsedAt: { lt: cooldownDate } },
  ];

  // Exclude specific asset IDs
  if (input.constraints?.exclude_asset_ids?.length) {
    where.id = { notIn: input.constraints.exclude_asset_ids };
  }

  // Orientation filter
  if (input.constraints?.orientation) {
    if (input.constraints.orientation === "landscape") {
      where.width = { gt: prisma.$queryRaw`"height"` as unknown as number };
    }
  }

  // Min width
  if (input.constraints?.min_width) {
    where.width = {
      ...(typeof where.width === "object" ? where.width : {}),
      gte: input.constraints.min_width,
    };
  }

  // Required tags filter
  if (input.required_tags?.length) {
    where.tags = {
      some: {
        tag: {
          slug: { in: input.required_tags },
        },
      },
    };
  }

  // Fetch candidates
  let candidates = await prisma.asset.findMany({
    where,
    include: {
      tags: { include: { tag: true } },
    },
    orderBy: [{ usageCount: "asc" }, { lastUsedAt: "asc" }],
    take: 20,
  });

  // Filter orientation in application code (more reliable)
  if (input.constraints?.orientation) {
    candidates = candidates.filter((a) => {
      if (!a.width || !a.height) return true;
      switch (input.constraints!.orientation) {
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

  // Score by preferred tags
  if (input.preferred_tags?.length) {
    candidates.sort((a, b) => {
      const aScore = a.tags.filter((t) =>
        input.preferred_tags!.includes(t.tag.slug)
      ).length;
      const bScore = b.tags.filter((t) =>
        input.preferred_tags!.includes(t.tag.slug)
      ).length;
      return bScore - aScore;
    });
  }

  if (candidates.length === 0) return null;

  return {
    id: candidates[0].id,
    storageKey: candidates[0].storageKey,
    title: candidates[0].title,
    altText: candidates[0].altText,
    tags: candidates[0].tags.map((t) => t.tag.slug),
    usageCount: candidates[0].usageCount,
    lastUsedAt: candidates[0].lastUsedAt,
  };
}
