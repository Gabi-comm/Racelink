"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { termsConsents } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/session";
import { TERMS_VERSION } from "@/lib/terms";

export async function acceptTerms(): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Your session ended. Log in again." };
  // accepting twice is harmless
  await db
    .insert(termsConsents)
    .values({ userId: user.id, version: TERMS_VERSION })
    .onDuplicateKeyUpdate({ set: { version: TERMS_VERSION } });
  revalidatePath("/", "layout");
  return { ok: true };
}
