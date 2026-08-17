import { readStatistics } from "@/lib/db/statistics";

export default async function DownloadsPage() {
  const stats = await readStatistics();
  const downloads = [...stats.downloads].reverse();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Downloads ({downloads.length})</h1>
      <div className="border border-zinc-800 rounded-xl divide-y divide-zinc-800 max-h-[70vh] overflow-y-auto">
        {downloads.slice(0, 300).map((d, i) => (
          <div key={i} className="p-3 flex items-center justify-between text-sm">
            <span className="font-medium">{d.slug}</span>
            <span className="text-zinc-500 text-xs">{new Date(d.timestamp).toLocaleString()}</span>
          </div>
        ))}
        {downloads.length === 0 && <p className="p-4 text-sm text-zinc-500">No downloads yet.</p>}
      </div>
    </div>
  );
}
