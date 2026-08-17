import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { DATA_DIRECTORY } from "@/lib/db/database";
import { toolsRepo } from "@/lib/db/tools";
import { categoriesRepo } from "@/lib/db/categories";
import { usersRepo } from "@/lib/db/users";
import { readStatistics } from "@/lib/db/statistics";
import { listActivity } from "@/lib/db/activity";

const JSON_FILES = [
  "tools.json",
  "categories.json",
  "users.json",
  "statistics.json",
  "settings.json",
  "activity.json",
];

async function dirSize(dir: string): Promise<number> {
  let total = 0;
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += await dirSize(full);
    } else {
      const stat = await fs.stat(full);
      total += stat.size;
    }
  }
  return total;
}

export async function GET() {
  const validation: Record<string, "valid" | "invalid" | "missing"> = {};
  let lastUpdate: string | null = null;

  for (const filename of JSON_FILES) {
    const filePath = path.join(DATA_DIRECTORY, filename);
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      JSON.parse(raw);
      validation[filename] = "valid";
      const stat = await fs.stat(filePath);
      const mtime = stat.mtime.toISOString();
      if (!lastUpdate || mtime > lastUpdate) lastUpdate = mtime;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      validation[filename] = code === "ENOENT" ? "missing" : "invalid";
    }
  }

  const [tools, categories, users, stats, activities] = await Promise.all([
    toolsRepo.read(),
    categoriesRepo.read(),
    usersRepo.read(),
    readStatistics(),
    listActivity(1),
  ]);

  const filesDirSize = await dirSize(path.join(DATA_DIRECTORY, "files"));
  const jsonDirSize = await dirSize(DATA_DIRECTORY) - filesDirSize;

  const backupsDir = path.join(DATA_DIRECTORY, "backups");
  let lastBackup: string | null = null;
  try {
    const entries = await fs.readdir(backupsDir);
    if (entries.length > 0) {
      const sorted = entries.sort().reverse();
      lastBackup = sorted[0];
    }
  } catch {
    // no backups yet
  }

  return NextResponse.json({
    status: Object.values(validation).every((v) => v === "valid") ? "healthy" : "attention_needed",
    validation,
    totalRecords: {
      tools: tools.length,
      categories: categories.length,
      users: users.length,
      downloads: stats.downloads.length,
      views: stats.views.length,
    },
    databaseSizeBytes: jsonDirSize,
    storageUsageBytes: filesDirSize,
    fileCount: tools.filter((t) => t.filepath).length,
    lastUpdate,
    lastBackup,
  });
}
