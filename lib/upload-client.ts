"use client";

import { requestUpload } from "@/lib/upload-actions";
import { checkFile, type UploadKind } from "@/lib/uploads";

// ask server for a signed link, then send the file straight to s3 (or local)
export async function uploadFile(kind: UploadKind, file: File): Promise<{ key: string } | { error: string }> {
  const problem = checkFile(kind, file.type, file.size);
  if (problem) return { error: problem };

  const res = await requestUpload(kind, file.type, file.size);
  if (!res.ok) return { error: res.error };

  try {
    const put = await fetch(res.ticket.url, { method: "PUT", headers: res.ticket.headers, body: file });
    if (!put.ok) return { error: "The upload didn't go through. Try again." };
  } catch {
    return { error: "The upload didn't go through. Check your connection and try again." };
  }
  return { key: res.ticket.key };
}
