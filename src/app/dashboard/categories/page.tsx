"use client";

import { useEffect, useState, FormEvent } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  enabled: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data.categories || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create category");
      return;
    }
    setName("");
    setDescription("");
    load();
  }

  async function toggleEnabled(id: string, enabled: boolean) {
    await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    load();
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete category "${name}"?`)) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      return;
    }
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Categories</h1>

      <form onSubmit={handleCreate} className="flex gap-2 mb-8 max-w-xl">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          required
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
        />
        <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
          Add
        </button>
      </form>
      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      <div className="border border-zinc-800 rounded-xl divide-y divide-zinc-800">
        {categories.map((c) => (
          <div key={c.id} className="p-4 flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-zinc-500 text-xs">{c.description || c.slug}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleEnabled(c.id, c.enabled)}
                className={`text-xs px-2 py-1 rounded ${c.enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}
              >
                {c.enabled ? "Enabled" : "Disabled"}
              </button>
              <button onClick={() => remove(c.id, c.name)} className="text-red-400 text-xs hover:underline">
                Delete
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="p-4 text-sm text-zinc-500">No categories yet.</p>
        )}
      </div>
    </div>
  );
}
