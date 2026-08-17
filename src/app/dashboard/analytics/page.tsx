import { readStatistics } from "@/lib/db/statistics";
import { toolsRepo } from "@/lib/db/tools";

export default async function AnalyticsPage() {
  const [stats, tools] = await Promise.all([readStatistics(), toolsRepo.read()]);

  const downloadsByTool: Record<string, number> = {};
  for (const d of stats.downloads) downloadsByTool[d.slug] = (downloadsByTool[d.slug] || 0) + 1;
  const top = Object.entries(downloadsByTool).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxCount = top[0]?.[1] || 1;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          ["Tools", tools.length],
          ["Public", tools.filter((t) => t.status === "PUBLIC").length],
          ["Downloads", stats.downloads.length],
          ["Views", stats.views.length],
        ].map(([label, value]) => (
          <div key={label as string} className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/40">
            <p className="text-xs text-zinc-500 mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-3">Top Tools by Downloads</h2>
      <div className="border border-zinc-800 rounded-xl p-5 space-y-3">
        {top.map(([slug, count]) => (
          <div key={slug}>
            <div className="flex justify-between text-sm mb-1">
              <span>{slug}</span>
              <span className="text-zinc-500">{count}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-white" style={{ width: `${(count / maxCount) * 100}%` }} />
            </div>
          </div>
        ))}
        {top.length === 0 && <p className="text-sm text-zinc-500">No download data yet.</p>}
      </div>
    </div>
  );
}
