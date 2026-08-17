import { CollectionRepository } from "./database";
import { CategoryRecord } from "../types";

export const categoriesRepo = new CollectionRepository<CategoryRecord, "categories">(
  "categories.json",
  "categories"
);

export async function listEnabledCategories(): Promise<CategoryRecord[]> {
  const items = await categoriesRepo.find((c) => c.enabled);
  return items.sort((a, b) => a.order - b.order);
}

export async function listAllCategoriesSorted(): Promise<CategoryRecord[]> {
  const items = await categoriesRepo.read();
  return items.sort((a, b) => a.order - b.order);
}
