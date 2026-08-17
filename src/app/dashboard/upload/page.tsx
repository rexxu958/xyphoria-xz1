"use client";

import { useState, useEffect, FormEvent } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
}

export default function UploadPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Upload failed" });
        return;
      }
      setMessage({ type: "success", text: `Uploaded "${data.tool.name}" successfully.` });
      (e.target as HTMLFormElement).reset();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Upload Tool</h1>
      <form onSubmit={handleSubmit} className="max-w-xl flex flex-col gap-4">
        <Field label="File">
          <input type="file" name="file" required className="text-sm" />
        </Field>
        <Field label="Name">
          <input name="name" required className="input" />
        </Field>
        <Field label="Category">
          <select name="category" className="input">
            <option value="uncategorized">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Description">
          <textarea name="description" rows={4} className="input" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Version">
            <input name="version" defaultValue="1.0.0" className="input" />
          </Field>
          <Field label="Author">
            <input name="author" defaultValue="XYPHORIA" className="input" />
          </Field>
        </div>
        <Field label="Tags (comma separated)">
          <input name="tags" placeholder="cli, automation, utility" className="input" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Status">
            <select name="status" className="input" defaultValue="DRAFT">
              <option value="DRAFT">Draft</option>
              <option value="PUBLIC">Public</option>
              <option value="HIDDEN">Hidden</option>
            </select>
          </Field>
          <Field label="Featured">
            <select name="featured" className="input" defaultValue="false">
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </Field>
        </div>

        {message && (
          <p className={`text-sm ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
            {message.text}
          </p>
        )}

        <button disabled={submitting} className="bg-white text-black font-medium px-4 py-2 rounded-lg disabled:opacity-50">
          {submitting ? "Uploading..." : "Upload"}
        </button>
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
        .input:focus { outline: none; border-color: #52525b; }
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
