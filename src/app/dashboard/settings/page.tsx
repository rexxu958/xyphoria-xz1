"use client";

import { useEffect, useState, FormEvent } from "react";

interface Settings {
  siteName: string;
  description: string;
  logo: string;
  favicon: string;
  footerText: string;
  socialLinks: Record<string, string>;
  maintenance: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then((d) => setSettings(d.settings));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaved(false);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (res.ok) setSaved(true);
  }

  if (!settings) return <p className="text-sm text-zinc-500">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Site Settings</h1>
      <form onSubmit={handleSubmit} className="max-w-xl flex flex-col gap-4">
        <Field label="Site Name">
          <input
            className="input"
            value={settings.siteName}
            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
          />
        </Field>
        <Field label="Description">
          <input
            className="input"
            value={settings.description}
            onChange={(e) => setSettings({ ...settings, description: e.target.value })}
          />
        </Field>
        <Field label="Footer Text">
          <input
            className="input"
            value={settings.footerText}
            onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
          />
        </Field>
        <Field label="Logo URL">
          <input
            className="input"
            value={settings.logo}
            onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
          />
        </Field>

        {saved && <p className="text-sm text-emerald-400">Settings saved.</p>}
        <button className="bg-white text-black font-medium px-4 py-2 rounded-lg w-fit">Save Settings</button>
      </form>
      <style jsx global>{`
        .input {
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 0.5rem;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          color: white;
          width: 100%;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-zinc-500">{label}</span>
      {children}
    </label>
  );
}
