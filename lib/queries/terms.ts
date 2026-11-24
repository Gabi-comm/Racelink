import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { termsConsents } from "@/lib/db/schema";
import { TERMS_VERSION } from "@/lib/terms";

export async function hasAcceptedTerms(userId: string) {
  const [row] = await db
    .select({ id: termsConsents.id })
    .from(termsConsents)
    .where(and(eq(termsConsents.userId, userId), eq(termsConsents.version, TERMS_VERSION)))
    .limit(1);
  return !!row;
}
