import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { toolsRepo } from "@/lib/db/tools";
import { localFileStorage } from "@/lib/storage/localFileStorage";
import { safeInternalFilename, isAllowedExtension, slugify } from "@/lib/security/sanitize";
import { logActivity } from "@/lib/db/activity";
import { recordUpload } from "@/lib/db/statistics";
import { ToolRecord, ToolStatus } from "@/lib/types";

const MAX_UPLOAD_SIZE = Number(process.env.MAX_UPLOAD_SIZE || 200 * 1024 * 1024); // 200MB default

const CATEGORY_BY_MIME_PREFIX: Record<string, string> = {
  image: "images",
  video: "images",
  audio: "images",
};

function storageBucketFor(mimeType: string, originalName: string): string {
  const ext = originalName.toLowerCase();
  if (mimeType.startsWith("image/") || mimeType.startsWith("video/") || mimeType.startsWith("audio/")) {
    return "images";
  }
  if (ext.endsWith(".zip") || ext.endsWith(".rar") || ext.endsWith(".7z") || ext.endsWith(".tar") || ext.endsWith(".gz")) {
    return "projects";
  }
  if (ext.endsWith(".exe") || ext.endsWith(".apk") || ext.endsWith(".dmg") || ext.endsWith(".appimage")) {
    return "tools";
  }
  return "other";
}

/**
 * Handles a multipart/form-data upload:
 * fields: file (required), name, category, description, version, author, tags (comma separated), status, featured
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file field is required" }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json(
      { error: `File exceeds max upload size of ${Math.round(MAX_UPLOAD_SIZE / 1024 / 1024)}MB` },
      { status: 413 }
    );
  }

  if (!isAllowedExtension(file.name)) {
    return NextResponse.json({ error: "File extension not allowed" }, { status: 415 });
  }

  const name = (form.get("name") as string) || file.name;
  const category = (form.get("category") as string) || "uncategorized";
  const description = (form.get("description") as string) || "";
  const version = (form.get("version") as string) || "1.0.0";
  const author = (form.get("author") as string) || "XYPHORIA";
  const tags = ((form.get("tags") as string) || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const status = ((form.get("status") as string) as ToolStatus) || "DRAFT";
  const featured = form.get("featured") === "true";

  const slugBase = slugify(name);
  let slug = slugBase;
  let attempt = 1;
  while (await toolsRepo.findBySlug(slug)) {
    slug = `${slugBase}-${attempt++}`;
  }

  const internalName = safeInternalFilename(file.name);
  const bucket = storageBucketFor(file.type, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  const relativePath = await localFileStorage.save(buffer, internalName, bucket);

  const now = new Date().toISOString();
  const id = randomUUID();
  const record: ToolRecord = {
    id,
    name,
    slug,
    category,
    description,
    version,
    author,
    filename: file.name,
    filepath: relativePath,
    size: file.size,
    mimeType: file.type || "application/octet-stream",
    createdAt: now,
    updatedAt: now,
    status,
    featured,
    tags,
    downloadCount: 0,
  };

  await toolsRepo.create(record);
  await recordUpload(id, slug);
  await logActivity("FILE_UPLOADED", `tool:${slug}`, "SUCCESS");
  await logActivity("UPLOAD", `tool:${slug}`, "SUCCESS");

  const { filepath, ...safeRecord } = record;
  return NextResponse.json({ tool: safeRecord }, { status: 201 });
}
