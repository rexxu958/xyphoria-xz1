import fs from "fs/promises";
import path from "path";
import { DATA_DIRECTORY } from "../db/database";
import { StorageProvider } from "./storageProvider";

const FILES_ROOT = path.join(DATA_DIRECTORY, "files");

export class LocalFileStorage implements StorageProvider {
  async save(buffer: Buffer, internalName: string, category: string): Promise<string> {
    const safeCategory = ["tools", "images", "projects", "other"].includes(category)
      ? category
      : "other";
    const dir = path.join(FILES_ROOT, safeCategory);
    await fs.mkdir(dir, { recursive: true });
    const relativePath = path.join(safeCategory, internalName);
    const absolutePath = path.join(FILES_ROOT, relativePath);

    // Defense in depth: confirm the resolved path never escapes FILES_ROOT.
    if (!absolutePath.startsWith(FILES_ROOT)) {
      throw new Error("Invalid file path (path traversal attempt blocked)");
    }

    await fs.writeFile(absolutePath, buffer);
    return relativePath;
  }

  async delete(relativePath: string): Promise<void> {
    const absolutePath = this.getAbsolutePath(relativePath);
    try {
      await fs.unlink(absolutePath);
    } catch {
      // Already gone / never existed — not fatal.
    }
  }

  getAbsolutePath(relativePath: string): string {
    const absolutePath = path.normalize(path.join(FILES_ROOT, relativePath));
    if (!absolutePath.startsWith(FILES_ROOT)) {
      throw new Error("Invalid file path (path traversal attempt blocked)");
    }
    return absolutePath;
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      await fs.access(this.getAbsolutePath(relativePath));
      return true;
    } catch {
      return false;
    }
  }
}

export const localFileStorage = new LocalFileStorage();
