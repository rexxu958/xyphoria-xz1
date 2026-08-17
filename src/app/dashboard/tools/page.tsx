"use client";

import { useEffect, useState } from "react";

interface Tool {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: "PUBLIC" | "DRAFT" | "HIDDEN";
  featured: boolean;
  downloadCount: number;
  size: number;
  createdAt: string;
}

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/tools");
    const data = await res.json();
    setTools(data.tools || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: Tool["status"]) {
    await fetch(`/api/admin/tools/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function toggleFeatured(id: string, featured: boolean) {
    await fetch(`/api/admin/tools/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !featured }),
    });
    load();
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This also deletes the uploaded file.`)) return;
    await fetch(`/api/admin/tools/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tools ({tools.length})</h1>
      {loading ? (
        <p className="text-zinc-500 text-sm">Loading...</p>
      ) : (
        <div className="border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-zinc-500 text-left">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Status</th>
                <th className="p-3">Featured</th>
                <th className="p-3">Downloads</th>
                <th className="p-3">Size</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {tools.map((t) => (
                <tr key={t.id}>
                  <td className="p-3 font-medium">{t.name}</td>
                  <td className="p-3 text-zinc-400">{t.category}</td>
                  <td className="p-3">
                    <select
                      value={t.status}
                      onChange={(e) => setStatus(t.id, e.target.value as Tool["status"])}
                      className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLIC">Public</option>
                      <option value="HIDDEN">Hidden</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleFeatured(t.id, t.featured)}
                      className={`text-xs px-2 py-1 rounded ${t.featured ? "bg-amber-400 text-black" : "bg-zinc-800 text-zinc-400"}`}
                    >
                      {t.featured ? "Featured" : "Not featured"}
                    </button>
                  </td>
                  <td className="p-3 text-zinc-400">{t.downloadCount}</td>
                  <td className="p-3 text-zinc-400">{(t.size / (1024 * 1024)).toFixed(1)} MB</td>
                  <td className="p-3 text-right">
                    <button onClick={() => remove(t.id, t.name)} className="text-red-400 text-xs hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {tools.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-zinc-500">
                    No tools yet. Go to Upload to add your first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
