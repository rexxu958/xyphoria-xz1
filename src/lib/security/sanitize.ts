import path from "path";
import { randomUUID } from "crypto";

/** Turn a user-provided string into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || randomUUID().slice(0, 8);
}

/**
 * Generate a safe internal filename. NEVER use the user's original filename
 * as the on-disk name — always a fresh UUID, preserving only a validated extension.
 */
export function safeInternalFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, "");
  const safeExt = /^\.[a-z0-9]{1,10}$/.test(ext) ? ext : "";
  return `${randomUUID()}${safeExt}`;
}

const ALLOWED_EXTENSIONS = new Set([
  ".zip", ".rar", ".7z", ".tar", ".gz",
  ".js", ".ts", ".jsx", ".tsx", ".json", ".py", ".java", ".c", ".cpp", ".go", ".rs", ".php", ".rb", ".html", ".css",
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico",
  ".mp4", ".webm", ".mov",
  ".mp3", ".wav", ".ogg",
  ".pdf", ".doc", ".docx", ".txt", ".md",
  ".glb", ".gltf", ".fbx", ".obj",
  ".exe", ".apk", ".dmg", ".appimage",
]);

export function isAllowedExtension(originalName: string): boolean {
  const ext = path.extname(originalName).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
}

export function isPathSafe(candidateAbsolutePath: string, rootAbsolutePath: string): boolean {
  const normalized = path.normalize(candidateAbsolutePath);
  const normalizedRoot = path.normalize(rootAbsolutePath);
  return normalized.startsWith(normalizedRoot);
}
