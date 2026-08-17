import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { categoriesRepo, listAllCategoriesSorted } from "@/lib/db/categories";
import { slugify } from "@/lib/security/sanitize";
import { logActivity } from "@/lib/db/activity";
import { CategoryRecord } from "@/lib/types";

export async function GET() {
  const categories = await listAllCategoriesSorted();
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const all = await categoriesRepo.read();
  const slugBase = slugify(body.name);
  let slug = slugBase;
  let attempt = 1;
  while (all.some((c) => c.slug === slug)) slug = `${slugBase}-${attempt++}`;

  const now = new Date().toISOString();
  const category: CategoryRecord = {
    id: randomUUID(),
    name: body.name,
    slug,
    description: body.description || "",
    order: typeof body.order === "number" ? body.order : all.length,
    enabled: body.enabled !== false,
    createdAt: now,
    updatedAt: now,
  };
  await categoriesRepo.create(category);
  await logActivity("CATEGORY_CREATED", `category:${slug}`, "SUCCESS");
  return NextResponse.json({ category }, { status: 201 });
}

// Bulk reorder: { order: [{id, order}, ...] }
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.order)) {
    return NextResponse.json({ error: "order array is required" }, { status: 400 });
  }
  const categories = await categoriesRepo.read();
  for (const entry of body.order) {
    const cat = categories.find((c) => c.id === entry.id);
    if (cat) cat.order = entry.order;
  }
  await categoriesRepo.write(categories);
  await logActivity("CATEGORY_UPDATED", "categories:reorder", "SUCCESS");
  return NextResponse.json({ categories });
}
