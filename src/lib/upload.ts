import { createHash } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

export async function saveUploadedFile(
  buffer: Buffer,
  filename: string
): Promise<{ storageKey: string; sha256: string; sizeBytes: number }> {
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const ext = path.extname(filename);
  const storageKey = `${sha256}${ext}`;
  const dir = path.join(UPLOAD_DIR, storageKey.slice(0, 2));

  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, storageKey), buffer);

  return { storageKey: `${storageKey.slice(0, 2)}/${storageKey}`, sha256, sizeBytes: buffer.length };
}

export function getFilePath(storageKey: string): string {
  return path.join(UPLOAD_DIR, storageKey);
}

export function getImageDimensions(
  buffer: Buffer
): { width: number; height: number } | null {
  // Simple PNG dimension reader
  if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  }
  // Simple JPEG dimension reader
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      if (marker === 0xc0 || marker === 0xc2) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        return { width, height };
      }
      const len = buffer.readUInt16BE(offset + 2);
      offset += 2 + len;
    }
  }
  return null;
}

export function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
  };
  return mimeMap[ext] || "application/octet-stream";
}
