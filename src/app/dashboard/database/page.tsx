"use client";

import { useEffect, useState } from "react";

interface DbStatus {
  status: string;
  validation: Record<string, string>;
  totalRecords: Record<string, number>;
  databaseSizeBytes: number;
  storageUsageBytes: number;
  fileCount: number;
  lastUpdate: string | null;
  lastBackup: string | null;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DatabasePage() {
  const [status, setStatus] = useState<DbStatus | null>(null);

  function load() {
    fetch("/api/admin/database").then((r) => r.json()).then(setStatus);
  }

  useEffect(() => {
    load();
  }, []);

  if (!status) return <p className="text-sm text-zinc-500">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Database Status</h1>

      <div
        className={`inline-block mb-6 px-3 py-1.5 rounded-full text-sm font-medium ${
          status.status === "healthy" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
        }`}
      >
        {status.status === "healthy" ? "Healthy" : "Attention needed"}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="border border-zinc-800 rounded-xl p-5">
          <p className="text-xs text-zinc-500 mb-3">Total Records</p>
          <div className="space-y-1 text-sm">
            {Object.entries(status.totalRecords).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-zinc-400 capitalize">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="border border-zinc-800 rounded-xl p-5">
          <p className="text-xs text-zinc-500 mb-3">Storage</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Database size</span>
              <span className="font-medium">{formatBytes(status.databaseSizeBytes)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Files storage</span>
              <span className="font-medium">{formatBytes(status.storageUsageBytes)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">File count</span>
              <span className="font-medium">{status.fileCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Last update</span>
              <span className="font-medium">
                {status.lastUpdate ? new Date(status.lastUpdate).toLocaleString() : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Last backup</span>
              <span className="font-medium">{status.lastBackup || "None yet"}</span>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">JSON File Validation</h2>
      <div className="border border-zinc-800 rounded-xl divide-y divide-zinc-800">
        {Object.entries(status.validation).map(([file, state]) => (
          <div key={file} className="p-3 flex items-center justify-between text-sm">
            <span>{file}</span>
            <span
              className={
                state === "valid"
                  ? "text-emerald-400"
                  : state === "missing"
                  ? "text-amber-400"
                  : "text-red-400"
              }
            >
              {state}
            </span>
          </div>
        ))}
      </div>

      <button onClick={load} className="mt-6 text-sm text-zinc-400 hover:text-white underline">
        Re-validate
      </button>
    </div>
  );
}
