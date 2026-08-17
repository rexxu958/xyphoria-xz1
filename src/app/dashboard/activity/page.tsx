import { listActivity } from "@/lib/db/activity";

export default async function ActivityPage() {
  const activities = await listActivity(500);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Activity Log</h1>
      <div className="border border-zinc-800 rounded-xl divide-y divide-zinc-800 max-h-[75vh] overflow-y-auto">
        {activities.map((a) => (
          <div key={a.id} className="p-3 flex items-center justify-between text-sm">
            <span>
              <span className={`font-medium ${a.status === "FAILED" ? "text-red-400" : ""}`}>{a.action}</span>{" "}
              <span className="text-zinc-500">{a.target}</span>
            </span>
            <span className="text-zinc-500 text-xs">{new Date(a.timestamp).toLocaleString()}</span>
          </div>
        ))}
        {activities.length === 0 && <p className="p-4 text-sm text-zinc-500">No activity recorded yet.</p>}
      </div>
    </div>
  );
}
