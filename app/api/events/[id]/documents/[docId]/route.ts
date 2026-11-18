import type { NextRequest } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { eventDocuments, events } from "@/lib/db/schema";
import { fileUrl } from "@/lib/storage";

// public race file, only for listed races
export async function GET(request: NextRequest, ctx: RouteContext<"/api/events/[id]/documents/[docId]">) {
  const { id, docId } = await ctx.params;
  const eventId = Number(id);
  const documentId = Number(docId);
  if (!Number.isInteger(eventId) || !Number.isInteger(documentId)) return new Response("Not found", { status: 404 });

  const [doc] = await db
    .select({ key: eventDocuments.fileKey, title: eventDocuments.title })
    .from(eventDocuments)
    .innerJoin(events, eq(events.id, eventDocuments.eventId))
    .where(and(eq(eventDocuments.id, documentId), eq(events.id, eventId), inArray(events.status, ["open", "closed"])))
    .limit(1);
  if (!doc) return new Response("Not found", { status: 404 });

  return Response.redirect(new URL(await fileUrl(doc.key, doc.title), request.url), 302);
}
