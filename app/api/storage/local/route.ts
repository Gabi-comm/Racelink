import type { NextRequest } from "next/server";
import { readLocal, usingS3, verifyLocal, writeLocal } from "@/lib/storage";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
};

// dev only, s3 handles this on aws
export async function PUT(request: NextRequest) {
  if (usingS3) return new Response("Not found", { status: 404 });
  const ok = verifyLocal("put", request.nextUrl.searchParams);
  if (!ok) return new Response("Upload link expired or invalid", { status: 403 });

  const data = Buffer.from(await request.arrayBuffer());
  if (data.length !== ok.size) return new Response("File size doesn't match", { status: 400 });

  await writeLocal(ok.key, data);
  return new Response(null, { status: 200 });
}

export async function GET(request: NextRequest) {
  if (usingS3) return new Response("Not found", { status: 404 });
  const ok = verifyLocal("get", request.nextUrl.searchParams);
  if (!ok) return new Response("Link expired or invalid", { status: 403 });

  try {
    const data = await readLocal(ok.key);
    const ext = ok.key.split(".").pop() ?? "";
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("File not found", { status: 404 });
  }
}
