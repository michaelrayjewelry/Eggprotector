import prisma from "./prisma";

export interface PolicyConfig {
  max_posts_per_day: number;
  min_hours_between_posts: number;
  no_duplicate_within_days: number;
  max_hashtags: number;
  max_links_per_day: number;
  image_reuse_cooldown_days: number;
  disallowed_phrases: string[];
  required_tone: string;
}

export const DEFAULT_POLICY: PolicyConfig = {
  max_posts_per_day: 3,
  min_hours_between_posts: 4,
  no_duplicate_within_days: 14,
  max_hashtags: 2,
  max_links_per_day: 1,
  image_reuse_cooldown_days: 10,
  disallowed_phrases: [],
  required_tone: "tesla-apple",
};

export async function getPolicy(): Promise<PolicyConfig> {
  const rule = await prisma.policyRule.findFirst({
    where: { active: true },
    orderBy: { updatedAt: "desc" },
  });
  if (!rule) return DEFAULT_POLICY;
  return { ...DEFAULT_POLICY, ...(rule.config as object) };
}

export async function validatePost(
  text: string,
  policy: PolicyConfig
): Promise<{ valid: boolean; reasons: string[] }> {
  const reasons: string[] = [];

  // Check hashtag count
  const hashtags = (text.match(/#\w+/g) || []).length;
  if (hashtags > policy.max_hashtags) {
    reasons.push(
      `Too many hashtags: ${hashtags} (max ${policy.max_hashtags})`
    );
  }

  // Check disallowed phrases
  for (const phrase of policy.disallowed_phrases) {
    if (text.toLowerCase().includes(phrase.toLowerCase())) {
      reasons.push(`Contains disallowed phrase: "${phrase}"`);
    }
  }

  // Check character limit (X limit is 280)
  if (text.length > 280) {
    reasons.push(`Text too long: ${text.length} chars (max 280)`);
  }

  // Check links per day
  const links = (text.match(/https?:\/\/\S+/g) || []).length;
  if (links > policy.max_links_per_day) {
    reasons.push(
      `Too many links: ${links} (max ${policy.max_links_per_day})`
    );
  }

  // Check recent post count
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const postsToday = await prisma.postLog.count({
    where: {
      status: "POSTED",
      postedAt: { gte: today },
    },
  });
  if (postsToday >= policy.max_posts_per_day) {
    reasons.push(
      `Daily post limit reached: ${postsToday}/${policy.max_posts_per_day}`
    );
  }

  // Check minimum hours between posts
  const lastPost = await prisma.postLog.findFirst({
    where: { status: "POSTED" },
    orderBy: { postedAt: "desc" },
  });
  if (lastPost?.postedAt) {
    const hoursSince =
      (Date.now() - lastPost.postedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince < policy.min_hours_between_posts) {
      reasons.push(
        `Too soon since last post: ${hoursSince.toFixed(1)}h (min ${policy.min_hours_between_posts}h)`
      );
    }
  }

  // Check duplicate text
  const duplicateCutoff = new Date();
  duplicateCutoff.setDate(
    duplicateCutoff.getDate() - policy.no_duplicate_within_days
  );
  const duplicate = await prisma.postLog.findFirst({
    where: {
      text,
      status: "POSTED",
      postedAt: { gte: duplicateCutoff },
    },
  });
  if (duplicate) {
    reasons.push(
      `Duplicate text posted within ${policy.no_duplicate_within_days} days`
    );
  }

  return { valid: reasons.length === 0, reasons };
}
