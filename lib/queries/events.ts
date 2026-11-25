import "server-only";
import { connection } from "next/server";
import { and, asc, gte, inArray, sql } from "drizzle-orm";
import { isImageKey } from "@/lib/uploads";
import { db } from "@/lib/db";
import { eventDistances, eventDocuments, events, eventSizes, TSHIRT_SIZES } from "@/lib/db/schema";
import type { PublicEvent } from "@/lib/events";

// explicit aliases, drizzle drops table names inside sql`` kaya mali yung count dati
const registered = sql<number>`(
  SELECT COUNT(*) FROM bookings AS b
  WHERE b.event_id = ${events}.id AND b.status IN ('pending', 'approved')
)`.mapWith(Number);

// open + closed events from today onward, draft/cancelled hidden
export async function getPublicEvents(): Promise<PublicEvent[]> {
  await connection();

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      location: events.location,
      eventDate: events.eventDate,
      startTime: events.startTime,
      registrationCloses: events.registrationCloses,
      capacity: events.capacity,
      status: events.status,
      bannerKey: events.bannerKey,
      registered,
    })
    .from(events)
    .where(and(inArray(events.status, ["open", "closed"]), gte(events.eventDate, sql`CURDATE()`)))
    .orderBy(asc(events.eventDate));

  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const [distances, sizes, documents] = await Promise.all([
    db
      .select({ id: eventDistances.id, eventId: eventDistances.eventId, label: eventDistances.label, price: eventDistances.price })
      .from(eventDistances)
      .where(inArray(eventDistances.eventId, ids))
      .orderBy(asc(eventDistances.price)),
    db
      .select({ eventId: eventSizes.eventId, size: eventSizes.size })
      .from(eventSizes)
      .where(inArray(eventSizes.eventId, ids)),
    db
      .select({ id: eventDocuments.id, eventId: eventDocuments.eventId, title: eventDocuments.title, fileKey: eventDocuments.fileKey })
      .from(eventDocuments)
      .where(inArray(eventDocuments.eventId, ids))
      .orderBy(asc(eventDocuments.createdAt)),
  ]);

  return rows.map(({ bannerKey, ...r }) => ({
    ...r,
    hasBanner: Boolean(bannerKey),
    distances: distances.filter((d) => d.eventId === r.id).map(({ id, label, price }) => ({ id, label, price })),
    sizes: sizes
      .filter((s) => s.eventId === r.id)
      .map((s) => s.size)
      .sort((a, b) => TSHIRT_SIZES.indexOf(a) - TSHIRT_SIZES.indexOf(b)),
    documents: documents.filter((d) => d.eventId === r.id).map(({ id, title, fileKey }) => ({ id, title, image: isImageKey(fileKey) })),
  }));
}

export async function getPublicEvent(id: number): Promise<PublicEvent | null> {
  const all = await getPublicEvents();
  return all.find((e) => e.id === id) ?? null;
}
