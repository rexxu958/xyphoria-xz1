import { notFound } from "next/navigation";
import { getPublicToolBySlug } from "@/lib/db/tools";
import { recordView } from "@/lib/db/statistics";

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = await getPublicToolBySlug(slug);
  if (!tool) notFound();

  await recordView(tool.id, tool.slug);

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
        <span className="uppercase tracking-wide">{tool.category}</span>
        <span>•</span>
        <span>v{tool.version}</span>
      </div>
      <h1 className="text-3xl font-bold mb-4">{tool.name}</h1>
      <p className="text-zinc-400 mb-6 whitespace-pre-line">{tool.description}</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {tool.tags.map((tag) => (
          <span key={tag} className="text-xs bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1 text-zinc-400">
            #{tag}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-4 mb-10 text-sm text-zinc-500">
        <span>By {tool.author}</span>
        <span>•</span>
        <span>{tool.downloadCount} downloads</span>
        <span>•</span>
        <span>{(tool.size / (1024 * 1024)).toFixed(2)} MB</span>
      </div>

      <a
        href={`/api/download/${tool.slug}`}
        className="inline-block bg-white text-black font-medium px-6 py-3 rounded-lg hover:bg-zinc-200 transition"
      >
        Download {tool.filename}
      </a>
    </div>
  );
}
