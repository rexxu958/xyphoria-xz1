"use client";

import { useEffect, useState } from "react";

interface FileEntry {
  id: string;
  toolSlug: string;
  filename: string;
  size: number;
  mimeType: string;
  createdAt: string;
  downloadCount: number;
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileEntry[]>([]);

  async function load() {
    const res = await fetch("/api/admin/files");
    const data = await res.json();
    setFiles(data.files || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(toolId: string, filename: string) {
    if (!confirm(`Remove file "${filename}"? The tool listing will remain as a draft without a file.`)) return;
    await fetch(`/api/admin/files?toolId=${toolId}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Files ({files.length})</h1>
      <div className="border border-zinc-800 rounded-xl divide-y divide-zinc-800">
        {files.map((f) => (
          <div key={f.id} className="p-4 flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">{f.filename || "(no file)"}</p>
              <p className="text-zinc-500 text-xs">
                {f.mimeType} • {(f.size / (1024 * 1024)).toFixed(2)} MB • {f.downloadCount} downloads
              </p>
            </div>
            {f.filename && (
              <button onClick={() => remove(f.id, f.filename)} className="text-red-400 text-xs hover:underline">
                Remove
              </button>
            )}
          </div>
        ))}
        {files.length === 0 && <p className="p-4 text-sm text-zinc-500">No files uploaded yet.</p>}
      </div>
    </div>
  );
}
