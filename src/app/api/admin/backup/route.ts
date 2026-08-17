import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { DATA_DIRECTORY } from "@/lib/db/database";
import { logActivity } from "@/lib/db/activity";

const BACKUP_FILES = [
  "tools.json",
  "categories.json",
  "users.json",
  "statistics.json",
  "settings.json",
  "activity.json",
];
const BACKUPS_DIR = path.join(DATA_DIRECTORY, "backups");

export async function GET() {
  await fs.mkdir(BACKUPS_DIR, { recursive: true });
  const entries = await fs.readdir(BACKUPS_DIR, { withFileTypes: true });
  const backups = await Promise.all(
    entries
      .filter((e) => e.isDirectory())
      .map(async (e) => {
        const stat = await fs.stat(path.join(BACKUPS_DIR, e.name));
        return { name: e.name, createdAt: stat.birthtime };
      })
  );
  backups.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return NextResponse.json({ backups });
}

// Create a manual backup snapshot. Not run automatically per-request — owner-triggered only.
export async function POST() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const targetDir = path.join(BACKUPS_DIR, timestamp);
  await fs.mkdir(targetDir, { recursive: true });

  for (const filename of BACKUP_FILES) {
    const src = path.join(DATA_DIRECTORY, filename);
    try {
      await fs.copyFile(src, path.join(targetDir, filename));
    } catch {
      // File may not exist yet — skip it, don't fail the whole backup.
    }
  }

  await logActivity("BACKUP_CREATED", timestamp, "SUCCESS");
  return NextResponse.json({ ok: true, name: timestamp }, { status: 201 });
}

// Restore from a named backup snapshot.
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = body?.name;
  if (!name || typeof name !== "string" || name.includes("..") || name.includes("/")) {
    return NextResponse.json({ error: "Valid backup name is required" }, { status: 400 });
  }

  const sourceDir = path.join(BACKUPS_DIR, name);
  try {
    await fs.access(sourceDir);
  } catch {
    return NextResponse.json({ error: "Backup not found" }, { status: 404 });
  }

  for (const filename of BACKUP_FILES) {
    const src = path.join(sourceDir, filename);
    try {
      await fs.copyFile(src, path.join(DATA_DIRECTORY, filename));
    } catch {
      // Missing file in that backup snapshot — skip.
    }
  }

  await logActivity("BACKUP_RESTORED", name, "SUCCESS");
  return NextResponse.json({ ok: true });
}
