import "server-only";
import { connection } from "next/server";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, eventDistances, events, eventSizes, paymentProofs, runnerProfiles, TSHIRT_SIZES } from "@/lib/db/schema";
import { todayInManila } from "@/lib/events";

export const ACTIVE = ["pending", "approved"] as const;

const takenForDistance = sql<number>`(
  SELECT COUNT(*) FROM bookings AS b
  WHERE b.distance_id = ${eventDistances}.id AND b.status IN ('pending', 'approved')
)`.mapWith(Number);

export type RegisterContext = NonNullable<Awaited<ReturnType<typeof getRegisterContext>>>;

export async function getRegisterContext(userId: string, eventId: number) {
  await connection();
  const [event] = await db
    .select({
      id: events.id,
      title: events.title,
      location: events.location,
      eventDate: events.eventDate,
      startTime: events.startTime,
      registrationCloses: events.registrationCloses,
      capacity: events.capacity,
      status: events.status,
      paymentMethod: events.paymentMethod,
      paymentBank: events.paymentBank,
      paymentAccountName: events.paymentAccountName,
      paymentAccountNumber: events.paymentAccountNumber,
      paymentInstructions: events.paymentInstructions,
      registered: sql<number>`(SELECT COUNT(*) FROM bookings AS b WHERE b.event_id = ${events}.id AND b.status IN ('pending', 'approved'))`.mapWith(Number),
    })
    .from(events)
    .where(and(eq(events.id, eventId), inArray(events.status, ["open", "closed", "cancelled"])))
    .limit(1);
  if (!event) return null;

  const [distances, sizes, [existing], [profile]] = await Promise.all([
    db
      .select({ id: eventDistances.id, label: eventDistances.label, price: eventDistances.price, slots: eventDistances.slots, taken: takenForDistance })
      .from(eventDistances)
      .where(eq(eventDistances.eventId, eventId))
      .orderBy(asc(eventDistances.price)),
    db.select({ size: eventSizes.size }).from(eventSizes).where(eq(eventSizes.eventId, eventId)),
    db
      .select({ id: bookings.id, status: bookings.status })
      .from(bookings)
      .where(and(eq(bookings.eventId, eventId), eq(bookings.userId, userId)))
      .limit(1),
    db.select().from(runnerProfiles).where(eq(runnerProfiles.userId, userId)).limit(1),
  ]);

  return {
    event,
    distances: distances.map((d) => ({ ...d, left: d.slots === null ? null : Math.max(0, d.slots - d.taken) })),
    sizes: sizes.map((s) => s.size).sort((a, b) => TSHIRT_SIZES.indexOf(a) - TSHIRT_SIZES.indexOf(b)),
    existing: existing ?? null,
    profile: profile ?? null,
  };
}

// why a race can't take this registration right now, or null if it can
export function registrationBlock(e: { status: string; registrationCloses: string | null; capacity: number | null; registered: number }) {
  if (e.status === "cancelled") return "This race was cancelled.";
  if (e.status !== "open") return "Registration for this race is closed.";
  if (e.registrationCloses && e.registrationCloses < todayInManila()) return "Registration for this race has closed.";
  if (e.capacity !== null && e.registered >= e.capacity) return "This race is sold out.";
  return null;
}

export type MyBooking = Awaited<ReturnType<typeof getMyBookings>>[number];

export async function getMyBookings(userId: string) {
  await connection();
  const rows = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      distanceLabel: bookings.distanceLabel,
      price: bookings.price,
      tshirtSize: bookings.tshirtSize,
      bibNumber: bookings.bibNumber,
      createdAt: bookings.createdAt,
      eventId: events.id,
      title: events.title,
      location: events.location,
      eventDate: events.eventDate,
      startTime: events.startTime,
      eventStatus: events.status,
      paymentMethod: events.paymentMethod,
      paymentBank: events.paymentBank,
      paymentAccountName: events.paymentAccountName,
      paymentAccountNumber: events.paymentAccountNumber,
      paymentInstructions: events.paymentInstructions,
    })
    .from(bookings)
    .innerJoin(events, eq(events.id, bookings.eventId))
    .where(eq(bookings.userId, userId))
    .orderBy(asc(events.eventDate));

  if (rows.length === 0) return [];
  const proofs = await db
    .select({
      id: paymentProofs.id,
      bookingId: paymentProofs.bookingId,
      status: paymentProofs.status,
      amount: paymentProofs.amount,
      referenceNo: paymentProofs.referenceNo,
      reviewNote: paymentProofs.reviewNote,
      createdAt: paymentProofs.createdAt,
    })
    .from(paymentProofs)
    .where(inArray(paymentProofs.bookingId, rows.map((r) => r.id)))
    .orderBy(desc(paymentProofs.createdAt), desc(paymentProofs.id));

  return rows.map((r) => ({ ...r, proofs: proofs.filter((p) => p.bookingId === r.id) }));
}
