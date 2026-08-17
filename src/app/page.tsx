import Link from "next/link";
import { listPublicTools } from "@/lib/db/tools";
import { listEnabledCategories } from "@/lib/db/categories";
import ModelViewer from "@/components/ModelViewer";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const [allTools, categories] = await Promise.all([listPublicTools(), listEnabledCategories()]);

  let tools = allTools;
  if (category) tools = tools.filter((t) => t.category === category);
  if (q) {
    const query = q.toLowerCase();
    tools = tools.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <section className="grid md:grid-cols-2 gap-10 items-center mb-16">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Tools, code and innovation.
          </h1>
          <p className="text-zinc-400 mb-6">
            Browse and download tools, source code, and projects published on XYPHORIA.
          </p>
          <form action="/" className="flex gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search tools..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-zinc-600"
            />
            <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium">
              Search
            </button>
          </form>
        </div>
        <ModelViewer />
      </section>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/"
            className={`text-xs px-3 py-1.5 rounded-full border ${
              !category ? "bg-white text-black border-white" : "border-zinc-700 text-zinc-400"
            }`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/?category=${c.slug}`}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                category === c.slug ? "bg-white text-black border-white" : "border-zinc-700 text-zinc-400"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {tools.length === 0 ? (
        <p className="text-zinc-500 text-sm py-20 text-center">
          No tools published yet. Check back soon.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.slug}`}
              className="border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition bg-zinc-900/40"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{tool.name}</h3>
                {tool.featured && (
                  <span className="text-[10px] bg-amber-400 text-black px-2 py-0.5 rounded-full font-medium">
                    Featured
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-400 line-clamp-2 mb-3">{tool.description}</p>
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>v{tool.version}</span>
                <span>{tool.downloadCount} downloads</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
