"use server";

import { canManageEvents } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import { createUpload, type UploadTicket } from "@/lib/storage";
import { checkFile, type UploadKind, UPLOAD_KINDS } from "@/lib/uploads";

export type UploadResult = { ok: true; ticket: UploadTicket } | { ok: false; error: string };

export async function requestUpload(kind: UploadKind, contentType: string, size: number): Promise<UploadResult> {
  if (!(kind in UPLOAD_KINDS)) return { ok: false, error: "Unknown upload type." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Your session ended. Log in again to upload." };
  if ((kind === "banner" || kind === "document") && !canManageEvents(user.role)) {
    return { ok: false, error: "Only organizers can upload race files." };
  }

  const problem = checkFile(kind, contentType, size);
  if (problem) return { ok: false, error: problem };

  return { ok: true, ticket: await createUpload(kind, user.id, contentType, size) };
}
