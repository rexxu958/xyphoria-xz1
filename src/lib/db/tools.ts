import { CollectionRepository } from "./database";
import { ToolRecord } from "../types";

export const toolsRepo = new CollectionRepository<ToolRecord, "tools">("tools.json", "tools");

export async function listPublicTools(): Promise<ToolRecord[]> {
  return toolsRepo.find((t) => t.status === "PUBLIC");
}

export async function getPublicToolBySlug(slug: string): Promise<ToolRecord | undefined> {
  const tool = await toolsRepo.findBySlug(slug);
  if (!tool || tool.status !== "PUBLIC") return undefined;
  return tool;
}

export async function searchPublicTools(query: string): Promise<ToolRecord[]> {
  const q = query.trim().toLowerCase();
  const all = await listPublicTools();
  if (!q) return all;
  return all.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
      t.category.toLowerCase().includes(q)
  );
}

export async function incrementDownloadCount(id: string): Promise<void> {
  const tool = await toolsRepo.findById(id);
  if (!tool) return;
  await toolsRepo.update(id, { downloadCount: (tool.downloadCount || 0) + 1 });
}
