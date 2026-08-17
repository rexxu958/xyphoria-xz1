import { NextResponse } from "next/server";
import { readStatistics } from "@/lib/db/statistics";
import { toolsRepo } from "@/lib/db/tools";

export async function GET() {
  const stats = await readStatistics();
  const tools = await toolsRepo.read();

  const totalDownloads = stats.downloads.length;
  const totalViews = stats.views.length;
  const totalUploads = stats.uploads.length;

  const downloadsByTool: Record<string, number> = {};
  for (const d of stats.downloads) {
    downloadsByTool[d.slug] = (downloadsByTool[d.slug] || 0) + 1;
  }

  const topTools = Object.entries(downloadsByTool)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([slug, count]) => ({ slug, downloads: count }));

  return NextResponse.json({
    totalTools: tools.length,
    publicTools: tools.filter((t) => t.status === "PUBLIC").length,
    totalDownloads,
    totalViews,
    totalUploads,
    topTools,
    recentDownloads: stats.downloads.slice(-20).reverse(),
  });
}
