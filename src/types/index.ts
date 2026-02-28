export interface AssetResponse {
  id: string;
  type: string;
  storageKey: string;
  originalFilename: string;
  title: string;
  altText: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  status: string;
  createdAt: string;
  lastUsedAt: string | null;
  usageCount: number;
  tags: TagResponse[];
}

export interface TagResponse {
  id: string;
  slug: string;
  label: string;
}

export interface PostLogResponse {
  id: string;
  text: string;
  status: string;
  slot: string | null;
  scheduledFor: string | null;
  postedAt: string | null;
  xTweetId: string | null;
  failureReason: string | null;
  createdAt: string;
  assets: AssetResponse[];
}

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

export interface ApiError {
  error: string;
  details?: string;
}
