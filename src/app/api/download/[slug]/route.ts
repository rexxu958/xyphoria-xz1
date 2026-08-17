import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { toolsRepo } from "@/lib/db/tools";
import { localFileStorage } from "@/lib/storage/localFileStorage";
import { recordDownload } from "@/lib/db/statistics";
import { rateLimit, clientKeyFromRequest } from "@/lib/security/rateLimit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Basic abuse protection: 30 downloads / 5 min / IP across all tools.
  const key = `download:${clientKeyFromRequest(req)}`;
  const { allowed } = rateLimit(key, 30, 5 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests, slow down." }, { status: 429 });
  }

  // 1. validate tool exists
  const tool = await toolsRepo.findBySlug(slug);
  if (!tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }

  // 2. validate tool status
  if (tool.status !== "PUBLIC") {
    return NextResponse.json({ error: "This tool is not available for download" }, { status: 403 });
  }

  // 3. find file by metadata (never trust a path from the client)
  const exists = await localFileStorage.exists(tool.filepath);
  if (!exists) {
    return NextResponse.json({ error: "File missing on server" }, { status: 404 });
  }
  const absolutePath = localFileStorage.getAbsolutePath(tool.filepath);

  // 4. record download (statistics.json + tool metadata)
  await recordDownload(tool.id, tool.slug);
  await toolsRepo.update(tool.id, { downloadCount: (tool.downloadCount || 0) + 1 });

  // 5. stream file to the client
  const stat = fs.statSync(absolutePath);
  const stream = fs.createReadStream(absolutePath);
  const webStream = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk) => controller.enqueue(chunk));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
    cancel() {
      stream.destroy();
    },
  });

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": tool.mimeType || "application/octet-stream",
      "Content-Length": String(stat.size),
      "Content-Disposition": `attachment; filename="${encodeURIComponent(tool.filename)}"`,
      "Cache-Control": "no-store",
    },
  });
}
