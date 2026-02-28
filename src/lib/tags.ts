/**
 * Tag normalization utilities.
 * Ensures consistent slug format: lowercase, dash-separated, trimmed.
 */
export function normalizeTagSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeTagLabel(input: string): string {
  return input.trim();
}
