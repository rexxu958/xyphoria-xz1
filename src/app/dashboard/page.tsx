import { readStatistics } from "@/lib/db/statistics";
import { toolsRepo } from "@/lib/db/tools";
import { listActivity } from "@/lib/db/activity";

export default async function OverviewPage() {
  const [stats, tools, activities] = await Promise.all([
    readStatistics(),
    toolsRepo.read(),
    listActivity(5),
  ]);

  const cards = [
    { label: "Total Tools", value: tools.length },
    { label: "Public Tools", value: tools.filter((t) => t.status === "PUBLIC").length },
    { label: "Total Downloads", value: stats.downloads.length },
    { label: "Total Views", value: stats.views.length },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {cards.map((c) => (
          <div key={c.label} className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/40">
            <p className="text-xs text-zinc-500 mb-1">{c.label}</p>
            <p className="text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
      <div className="border border-zinc-800 rounded-xl divide-y divide-zinc-800">
        {activities.length === 0 && <p className="p-4 text-sm text-zinc-500">No activity yet.</p>}
        {activities.map((a) => (
          <div key={a.id} className="p-4 flex items-center justify-between text-sm">
            <span>
              <span className="font-medium">{a.action}</span>{" "}
              <span className="text-zinc-500">{a.target}</span>
            </span>
            <span className="text-zinc-500 text-xs">{new Date(a.timestamp).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
