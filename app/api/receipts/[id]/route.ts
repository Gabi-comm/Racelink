import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, events, paymentProofs } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/session";
import { fileUrl } from "@/lib/storage";

// receipt: the runner, the race organizer, or an admin lang
export async function GET(request: NextRequest, ctx: RouteContext<"/api/receipts/[id]">) {
  const user = await getCurrentUser();
  if (!user) return new Response("Log in to view this receipt.", { status: 401 });

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return new Response("Not found", { status: 404 });

  const [row] = await db
    .select({ key: paymentProofs.fileKey, runnerId: bookings.userId, organizerId: events.organizerId })
    .from(paymentProofs)
    .innerJoin(bookings, eq(bookings.id, paymentProofs.bookingId))
    .innerJoin(events, eq(events.id, bookings.eventId))
    .where(eq(paymentProofs.id, id))
    .limit(1);

  const allowed = row && (row.runnerId === user.id || row.organizerId === user.id);
  if (!allowed) return new Response("Not found", { status: 404 });

  return Response.redirect(new URL(await fileUrl(row.key), request.url), 302);
}
