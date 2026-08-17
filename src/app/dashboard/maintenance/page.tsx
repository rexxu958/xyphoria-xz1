"use client";

import { useEffect, useState } from "react";

export default function MaintenancePage() {
  const [maintenance, setMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setMaintenance(Boolean(d.settings?.maintenance)))
      .finally(() => setLoading(false));
  }, []);

  async function toggle() {
    setSaving(true);
    const next = !maintenance;
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maintenance: next }),
    });
    if (res.ok) setMaintenance(next);
    setSaving(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Maintenance Mode</h1>
      <div className="border border-zinc-800 rounded-xl p-6 max-w-xl">
        <p className="text-sm text-zinc-400 mb-4">
          When enabled, the public site should show a maintenance notice while the owner dashboard
          stays fully accessible. Wire this flag into your public layout/middleware to actually
          gate the storefront.
        </p>
        {loading ? (
          <p className="text-sm text-zinc-500">Loading...</p>
        ) : (
          <button
            onClick={toggle}
            disabled={saving}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              maintenance ? "bg-red-500 text-white" : "bg-emerald-500 text-black"
            } disabled:opacity-50`}
          >
            {maintenance ? "Maintenance ON — click to disable" : "Maintenance OFF — click to enable"}
          </button>
        )}
      </div>
    </div>
  );
}
