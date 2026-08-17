"use client";

import { useEffect, useState } from "react";

interface Backup {
  name: string;
  createdAt: string;
}

export default function BackupPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [busy, setBusy] = useState(false);

  function load() {
    fetch("/api/admin/backup").then((r) => r.json()).then((d) => setBackups(d.backups || []));
  }

  useEffect(() => {
    load();
  }, []);

  async function createBackup() {
    setBusy(true);
    await fetch("/api/admin/backup", { method: "POST" });
    setBusy(false);
    load();
  }

  async function restore(name: string) {
    if (!confirm(`Restore backup "${name}"? This overwrites current tools/categories/users/settings/statistics/activity data.`)) return;
    setBusy(true);
    await fetch("/api/admin/backup", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setBusy(false);
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Backups</h1>

      <button
        onClick={createBackup}
        disabled={busy}
        className="bg-white text-black font-medium px-4 py-2 rounded-lg mb-6 disabled:opacity-50"
      >
        {busy ? "Working..." : "Create Backup Now"}
      </button>

      <div className="border border-zinc-800 rounded-xl divide-y divide-zinc-800">
        {backups.map((b) => (
          <div key={b.name} className="p-4 flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">{b.name}</p>
              <p className="text-zinc-500 text-xs">{new Date(b.createdAt).toLocaleString()}</p>
            </div>
            <button
              onClick={() => restore(b.name)}
              disabled={busy}
              className="text-xs text-amber-400 hover:underline disabled:opacity-50"
            >
              Restore
            </button>
          </div>
        ))}
        {backups.length === 0 && <p className="p-4 text-sm text-zinc-500">No backups yet.</p>}
      </div>
    </div>
  );
}
