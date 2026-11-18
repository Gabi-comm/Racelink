import type { NextRequest } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { fileUrl } from "@/lib/storage";

// public banner, redirects to a short-lived signed link
export async function GET(request: NextRequest, ctx: RouteContext<"/api/events/[id]/banner">) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return new Response("Not found", { status: 404 });

  const [row] = await db
    .select({ key: events.bannerKey })
    .from(events)
    .where(and(eq(events.id, id), inArray(events.status, ["open", "closed"])))
    .limit(1);
  if (!row?.key) return new Response("Not found", { status: 404 });

  return Response.redirect(new URL(await fileUrl(row.key), request.url), 302);
}
