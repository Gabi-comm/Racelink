import "server-only";
import { connection } from "next/server";
import { and, asc, count, desc, eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, eventDistances, eventDocuments, events, eventSizes, TSHIRT_SIZES, user } from "@/lib/db/schema";
import type { CurrentUser } from "@/lib/session";
import { canManageEvents } from "@/lib/roles";

// organizers work as one team and see every race; anyone else only their own
function scope(actor: CurrentUser): SQL | undefined {
  return canManageEvents(actor.role) ? undefined : eq(events.organizerId, actor.id);
}

const bookingCount = (status: string) =>
  sql<number>`(SELECT COUNT(*) FROM bookings AS b WHERE b.event_id = ${events}.id AND b.status = ${status})`.mapWith(Number);

export async function getManagedEvents(actor: CurrentUser) {
  await connection();
  return db
    .select({
      id: events.id,
      title: events.title,
      location: events.location,
      eventDate: events.eventDate,
      status: events.status,
      capacity: events.capacity,
      organizerName: user.name,
      requestedBy: events.requestedBy,
      approved: bookingCount("approved"),
      pending: bookingCount("pending"),
      totalBookings: sql<number>`(SELECT COUNT(*) FROM bookings AS b WHERE b.event_id = ${events}.id)`.mapWith(Number),
      collected: sql<number>`(SELECT COALESCE(SUM(b.price), 0) FROM bookings AS b WHERE b.event_id = ${events}.id AND b.status = 'approved')`.mapWith(Number),
    })
    .from(events)
    .innerJoin(user, eq(user.id, events.organizerId))
    .where(scope(actor))
    .orderBy(desc(events.eventDate));
}

export type ManagedEvent = NonNullable<Awaited<ReturnType<typeof getManagedEvent>>>;

export async function getManagedEvent(actor: CurrentUser, id: number) {
  await connection();
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), scope(actor)))
    .limit(1);
  if (!event) return null;

  const [distances, sizes, documents, [counts]] = await Promise.all([
    db
      .select({ id: eventDistances.id, label: eventDistances.label, price: eventDistances.price, slots: eventDistances.slots })
      .from(eventDistances)
      .where(eq(eventDistances.eventId, id))
      .orderBy(asc(eventDistances.price)),
    db.select({ size: eventSizes.size }).from(eventSizes).where(eq(eventSizes.eventId, id)),
    db
      .select({ id: eventDocuments.id, title: eventDocuments.title, fileKey: eventDocuments.fileKey, createdAt: eventDocuments.createdAt })
      .from(eventDocuments)
      .where(eq(eventDocuments.eventId, id))
      .orderBy(asc(eventDocuments.createdAt)),
    db.select({ total: count() }).from(bookings).where(eq(bookings.eventId, id)),
  ]);

  return {
    ...event,
    distances,
    sizes: sizes.map((s) => s.size).sort((a, b) => TSHIRT_SIZES.indexOf(a) - TSHIRT_SIZES.indexOf(b)),
    documents,
    bookingCount: counts?.total ?? 0,
  };
}
