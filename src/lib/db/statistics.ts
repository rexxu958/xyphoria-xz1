import { JsonFileDatabase } from "./database";
import { StatisticsData } from "../types";

const statsDb = new JsonFileDatabase<StatisticsData>("statistics.json");

export async function readStatistics(): Promise<StatisticsData> {
  return statsDb.read();
}

export async function recordDownload(toolId: string, slug: string): Promise<void> {
  const stats = await statsDb.read();
  stats.downloads.push({ toolId, slug, timestamp: new Date().toISOString() });
  await statsDb.write(stats);
}

export async function recordUpload(toolId: string, slug: string): Promise<void> {
  const stats = await statsDb.read();
  stats.uploads.push({ toolId, slug, timestamp: new Date().toISOString() });
  await statsDb.write(stats);
}

export async function recordView(toolId: string, slug: string): Promise<void> {
  const stats = await statsDb.read();
  stats.views.push({ toolId, slug, timestamp: new Date().toISOString() });
  await statsDb.write(stats);
}
