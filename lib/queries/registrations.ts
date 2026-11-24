import "server-only";
import { connection } from "next/server";
import { and, asc, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, events, paymentProofs, runnerProfiles, user } from "@/lib/db/schema";
import type { CurrentUser } from "@/lib/session";
import { canManageEvents } from "@/lib/roles";

export async function getRegistrations(actor: CurrentUser, eventId: number) {
  await connection();
  const [event] = await db
    .select({
      id: events.id,
      title: events.title,
      eventDate: events.eventDate,
      status: events.status,
      capacity: events.capacity,
      organizerId: events.organizerId,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (!event || (!canManageEvents(actor.role) && event.organizerId !== actor.id)) return null;

  const rows = await db
    .select({
      id: bookings.id,
      runnerName: user.name,
      email: user.email,
      phone: runnerProfiles.phone,
      gender: runnerProfiles.gender,
      birthdate: runnerProfiles.birthdate,
      emergencyName: runnerProfiles.emergencyName,
      emergencyPhone: runnerProfiles.emergencyPhone,
      distanceLabel: bookings.distanceLabel,
      price: bookings.price,
      tshirtSize: bookings.tshirtSize,
      status: bookings.status,
      bibNumber: bookings.bibNumber,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .innerJoin(user, eq(user.id, bookings.userId))
    .leftJoin(runnerProfiles, eq(runnerProfiles.userId, bookings.userId))
    .where(eq(bookings.eventId, eventId))
    .orderBy(
      sql`FIELD(${bookings.status}, 'pending', 'approved', 'rejected', 'cancelled')`,
      bookings.bibNumber,
      bookings.createdAt,
    );

  const proofs = rows.length
    ? await db
        .select({
          id: paymentProofs.id,
          bookingId: paymentProofs.bookingId,
          amount: paymentProofs.amount,
          referenceNo: paymentProofs.referenceNo,
          status: paymentProofs.status,
          reviewNote: paymentProofs.reviewNote,
          createdAt: paymentProofs.createdAt,
        })
        .from(paymentProofs)
        .where(inArray(paymentProofs.bookingId, rows.map((r) => r.id)))
        .orderBy(desc(paymentProofs.id))
    : [];

  const latest = new Map<number, (typeof proofs)[number]>();
  for (const p of proofs) if (!latest.has(p.bookingId)) latest.set(p.bookingId, p);

  const list = rows.map((r) => ({ ...r, proof: latest.get(r.id) ?? null }));
  const countOf = (s: string) => list.filter((r) => r.status === s).length;

  return {
    event,
    list,
    counts: {
      pending: countOf("pending"),
      approved: countOf("approved"),
      rejected: countOf("rejected"),
      cancelled: countOf("cancelled"),
    },
  };
}

export type Registration = NonNullable<Awaited<ReturnType<typeof getRegistrations>>>["list"][number];

// for actions: booking + event owner check
export async function managedBooking(actor: CurrentUser, bookingId: number) {
  const [row] = await db
    .select({ id: bookings.id, eventId: bookings.eventId, status: bookings.status, organizerId: events.organizerId })
    .from(bookings)
    .innerJoin(events, eq(events.id, bookings.eventId))
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (!row || (!canManageEvents(actor.role) && row.organizerId !== actor.id)) return null;
  return row;
}

// every registration across all races (organizers share every race)
export async function getParticipants(actor: CurrentUser) {
  await connection();
  const mine: SQL | undefined = canManageEvents(actor.role) ? undefined : eq(events.organizerId, actor.id);

  const [races, rows] = await Promise.all([
    db
      .select({ id: events.id, title: events.title, eventDate: events.eventDate, capacity: events.capacity })
      .from(events)
      .where(mine)
      .orderBy(desc(events.eventDate)),
    db
      .select({
        id: bookings.id,
        eventId: events.id,
        eventTitle: events.title,
        eventDate: events.eventDate,
        runnerName: user.name,
        email: user.email,
        phone: runnerProfiles.phone,
        emergencyName: runnerProfiles.emergencyName,
        emergencyPhone: runnerProfiles.emergencyPhone,
        distanceLabel: bookings.distanceLabel,
        price: bookings.price,
        tshirtSize: bookings.tshirtSize,
        status: bookings.status,
        bibNumber: bookings.bibNumber,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .innerJoin(events, eq(events.id, bookings.eventId))
      .innerJoin(user, eq(user.id, bookings.userId))
      .leftJoin(runnerProfiles, eq(runnerProfiles.userId, bookings.userId))
      .where(and(mine))
      .orderBy(
        sql`FIELD(${bookings.status}, 'pending', 'approved', 'rejected', 'cancelled')`,
        asc(events.eventDate),
        bookings.bibNumber,
        bookings.createdAt,
      ),
  ]);

  const proofs = rows.length
    ? await db
        .select({
          id: paymentProofs.id,
          bookingId: paymentProofs.bookingId,
          amount: paymentProofs.amount,
          referenceNo: paymentProofs.referenceNo,
          reviewNote: paymentProofs.reviewNote,
        })
        .from(paymentProofs)
        .where(inArray(paymentProofs.bookingId, rows.map((r) => r.id)))
        .orderBy(desc(paymentProofs.id))
    : [];
  const latest = new Map<number, (typeof proofs)[number]>();
  for (const p of proofs) if (!latest.has(p.bookingId)) latest.set(p.bookingId, p);

  return { races, list: rows.map((r) => ({ ...r, proof: latest.get(r.id) ?? null })) };
}

export type Participant = Awaited<ReturnType<typeof getParticipants>>["list"][number];
