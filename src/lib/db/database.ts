import fs from "fs";
import fsp from "fs/promises";
import path from "path";

/**
 * DatabaseProvider abstraction.
 * Today: JsonFileDatabase (flat JSON files on local disk).
 * Future: swap in SQLite/Postgres providers without touching callers,
 * as long as they implement this same interface.
 */
export interface DatabaseProvider<T> {
  read(): Promise<T>;
  write(data: T): Promise<void>;
}

export const DATA_DIRECTORY = process.env.DATA_DIRECTORY || path.join(process.cwd(), "data");

const FILE_SUBDIRS = ["tools", "images", "projects", "other"];

const DEFAULTS: Record<string, unknown> = {
  "tools.json": { tools: [] },
  "categories.json": { categories: [] },
  "users.json": { users: [] },
  "statistics.json": { downloads: [], uploads: [], views: [] },
  "settings.json": {
    siteName: "XYPHORIA",
    description: "Tools, code and innovation.",
    logo: "",
    favicon: "",
    footerText: "",
    socialLinks: {},
    maintenance: false,
  },
  "activity.json": { activities: [] },
};

let initPromise: Promise<void> | null = null;

/**
 * Ensures data/ and data/files/* exist, and every required JSON file exists
 * with a valid default structure. Safe to call many times, including many
 * concurrent times (e.g. several requests hitting the app on cold start) —
 * all callers share a single in-flight initialization promise so two
 * concurrent inits never race to write the same temp file.
 */
export function ensureDatabaseInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = doInitialize().catch((err) => {
      // Allow a retry on next call if initialization itself failed.
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

async function doInitialize(): Promise<void> {
  await fsp.mkdir(DATA_DIRECTORY, { recursive: true });
  await fsp.mkdir(path.join(DATA_DIRECTORY, "backups"), { recursive: true });
  for (const sub of FILE_SUBDIRS) {
    await fsp.mkdir(path.join(DATA_DIRECTORY, "files", sub), { recursive: true });
  }

  for (const [filename, defaultValue] of Object.entries(DEFAULTS)) {
    const filePath = path.join(DATA_DIRECTORY, filename);
    let needsWrite = false;

    if (!fs.existsSync(filePath)) {
      needsWrite = true;
    } else {
      try {
        const raw = await fsp.readFile(filePath, "utf-8");
        JSON.parse(raw);
      } catch {
        // Corrupt JSON -> reset to default rather than crash the app.
        needsWrite = true;
      }
    }

    if (needsWrite) {
      await atomicWriteFile(filePath, JSON.stringify(defaultValue, null, 2));
    }
  }
}

/**
 * Atomic write: write to a temp file, fsync, then rename over the target.
 * Prevents a crashed/killed process from leaving a half-written, corrupt JSON file.
 */
export async function atomicWriteFile(filePath: string, contents: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fsp.mkdir(dir, { recursive: true });
  const tmpPath = path.join(
    dir,
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`
  );

  const handle = await fsp.open(tmpPath, "w");
  try {
    await handle.writeFile(contents, "utf-8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fsp.rename(tmpPath, filePath);
}

/**
 * JsonFileDatabase: generic read/write for a single JSON file under DATA_DIRECTORY.
 * Serializes writes per-file to avoid concurrent-write races within one process.
 */
export class JsonFileDatabase<T> implements DatabaseProvider<T> {
  private filePath: string;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private filename: string) {
    this.filePath = path.join(DATA_DIRECTORY, filename);
  }

  async read(): Promise<T> {
    await ensureDatabaseInitialized();
    const raw = await fsp.readFile(this.filePath, "utf-8");
    try {
      return JSON.parse(raw) as T;
    } catch {
      const fallback = DEFAULTS[this.filename] as T;
      await this.write(fallback);
      return fallback;
    }
  }

  async write(data: T): Promise<void> {
    await ensureDatabaseInitialized();
    // Chain writes so concurrent callers don't interleave (last-write-wins, but atomically per write).
    this.writeQueue = this.writeQueue.then(() =>
      atomicWriteFile(this.filePath, JSON.stringify(data, null, 2))
    );
    return this.writeQueue;
  }
}

/**
 * Generic CRUD helper for JSON files that store a single array under `key`.
 * Implements: read, write, create, update, delete, find, findById, findBySlug.
 */
export class CollectionRepository<TItem extends { id: string; slug?: string }, TKey extends string> {
  private db: JsonFileDatabase<Record<TKey, TItem[]>>;

  constructor(filename: string, private key: TKey) {
    this.db = new JsonFileDatabase<Record<TKey, TItem[]>>(filename);
  }

  async read(): Promise<TItem[]> {
    const data = await this.db.read();
    return (data[this.key] as TItem[]) || [];
  }

  async write(items: TItem[]): Promise<void> {
    const data = (await this.db.read()) as Record<TKey, TItem[]>;
    data[this.key] = items;
    await this.db.write(data);
  }

  async find(predicate: (item: TItem) => boolean): Promise<TItem[]> {
    const items = await this.read();
    return items.filter(predicate);
  }

  async findOne(predicate: (item: TItem) => boolean): Promise<TItem | undefined> {
    const items = await this.read();
    return items.find(predicate);
  }

  async findById(id: string): Promise<TItem | undefined> {
    return this.findOne((item) => item.id === id);
  }

  async findBySlug(slug: string): Promise<TItem | undefined> {
    return this.findOne((item) => item.slug === slug);
  }

  async create(item: TItem): Promise<TItem> {
    const items = await this.read();
    items.push(item);
    await this.write(items);
    return item;
  }

  async update(id: string, patch: Partial<TItem>): Promise<TItem | undefined> {
    const items = await this.read();
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) return undefined;
    items[idx] = { ...items[idx], ...patch };
    await this.write(items);
    return items[idx];
  }

  async delete(id: string): Promise<boolean> {
    const items = await this.read();
    const next = items.filter((item) => item.id !== id);
    if (next.length === items.length) return false;
    await this.write(next);
    return true;
  }
}
