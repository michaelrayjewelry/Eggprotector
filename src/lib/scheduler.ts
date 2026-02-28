import prisma from "./prisma";
import { getPolicy, validatePost } from "./policy";
import { selectAsset } from "./asset-selector";

export type Slot = "morning" | "midday" | "evening";

const SLOT_HOURS: Record<Slot, number> = {
  morning: 9,
  midday: 13,
  evening: 18,
};

const POST_TEMPLATES = [
  "Building something special. More coming soon.",
  "Every detail matters when you're crafting for people who notice.",
  "The process is the product.",
  "Quiet progress. Loud results.",
  "Another day, another step closer to perfection.",
];

export async function runSlot(slot: Slot, userId: string) {
  // Check kill switch
  const killSwitch = await prisma.appSetting.findUnique({
    where: { key: "kill_switch" },
  });
  if (killSwitch && (killSwitch.value as { enabled: boolean }).enabled) {
    return { status: "blocked", reason: "Kill switch is active" };
  }

  const policy = await getPolicy();

  // Generate candidate text (in a real app, this would use the Content Brain / RAG)
  const template =
    POST_TEMPLATES[Math.floor(Math.random() * POST_TEMPLATES.length)];
  const text = template;

  // Validate against policy
  const validation = await validatePost(text, policy);
  if (!validation.valid) {
    return { status: "blocked", reasons: validation.reasons };
  }

  // Select an asset
  const asset = await selectAsset({
    intent: slot,
    preferred_tags: ["product", "brand"],
  });

  // Schedule the post
  const scheduledFor = new Date();
  scheduledFor.setHours(SLOT_HOURS[slot], 0, 0, 0);

  // Check if manual approval is required
  const approvalSetting = await prisma.appSetting.findUnique({
    where: { key: "require_approval" },
  });
  const requireApproval =
    approvalSetting &&
    (approvalSetting.value as { enabled: boolean }).enabled;

  const post = await prisma.postLog.create({
    data: {
      text,
      slot,
      scheduledFor,
      status: requireApproval ? "DRAFTED" : "APPROVED",
      createdById: userId,
      ...(asset
        ? {
            postAssets: {
              create: { assetId: asset.id },
            },
          }
        : {}),
    },
    include: {
      postAssets: { include: { asset: true } },
    },
  });

  // If auto-approved, attempt to post immediately
  if (!requireApproval) {
    return await executePost(post.id);
  }

  return {
    status: "drafted",
    postId: post.id,
    text: post.text,
    asset: asset ? { id: asset.id, title: asset.title } : null,
  };
}

export async function executePost(postId: string) {
  const post = await prisma.postLog.findUnique({
    where: { id: postId },
    include: { postAssets: { include: { asset: true } } },
  });

  if (!post) return { status: "error", reason: "Post not found" };

  // Check kill switch again right before posting
  const killSwitch = await prisma.appSetting.findUnique({
    where: { key: "kill_switch" },
  });
  if (killSwitch && (killSwitch.value as { enabled: boolean }).enabled) {
    await prisma.postLog.update({
      where: { id: postId },
      data: { status: "BLOCKED", failureReason: "Kill switch activated" },
    });
    return { status: "blocked", reason: "Kill switch is active" };
  }

  try {
    // Post to X API (placeholder — real implementation needs OAuth + twitter-api-v2)
    const xTweetId = await postToX(
      post.text,
      post.postAssets.map((pa) => pa.asset.storageKey)
    );

    // Update post log
    await prisma.postLog.update({
      where: { id: postId },
      data: {
        status: "POSTED",
        postedAt: new Date(),
        xTweetId,
      },
    });

    // Update asset usage
    for (const pa of post.postAssets) {
      await prisma.asset.update({
        where: { id: pa.assetId },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
        },
      });
    }

    return { status: "posted", xTweetId, postId };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    await prisma.postLog.update({
      where: { id: postId },
      data: {
        status: "FAILED",
        failureReason: message,
      },
    });
    return { status: "failed", reason: message };
  }
}

async function postToX(
  _text: string,
  _mediaKeys: string[]
): Promise<string> {
  // TODO: Implement actual X API integration
  // For now, simulate a post and return a fake tweet ID
  if (!process.env.X_API_KEY || !process.env.X_ACCESS_TOKEN) {
    // In dev mode, return a simulated tweet ID
    return `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  // Real implementation would use twitter-api-v2:
  // const client = new TwitterApi({ ... });
  // const tweet = await client.v2.tweet(text, { media: { media_ids: [...] } });
  // return tweet.data.id;
  throw new Error(
    "X API credentials configured but real posting not yet implemented. Install twitter-api-v2 and implement."
  );
}
