import "server-only";
import { connection } from "next/server";
import { and, asc, count, eq, gte, inArray, sql, sum, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, events, runnerProfiles, user } from "@/lib/db/schema";
import { todayInManila } from "@/lib/events";
import type { CurrentUser } from "@/lib/session";

export async function getRunnerDashboard(userId: string) {
  await connection();
  const today = todayInManila();

  const [upcoming, [profile], openRaces] = await Promise.all([
    db
      .select({
        id: bookings.id,
        eventId: events.id,
        title: events.title,
        location: events.location,
        eventDate: events.eventDate,
        startTime: events.startTime,
        eventStatus: events.status,
        distanceLabel: bookings.distanceLabel,
        status: bookings.status,
        bibNumber: bookings.bibNumber,
        attended: bookings.attended,
      })
      .from(bookings)
      .innerJoin(events, eq(events.id, bookings.eventId))
      .where(and(eq(bookings.userId, userId), inArray(bookings.status, ["pending", "approved", "rejected"]), gte(events.eventDate, today)))
      .orderBy(asc(events.eventDate)),
    db.select({ phone: runnerProfiles.phone, emergencyName: runnerProfiles.emergencyName }).from(runnerProfiles).where(eq(runnerProfiles.userId, userId)).limit(1),
    db
      .select({
        id: events.id,
        title: events.title,
        location: events.location,
        eventDate: events.eventDate,
        priceFrom: sql<number>`(SELECT MIN(d.price) FROM event_distances AS d WHERE d.event_id = ${events}.id)`.mapWith(Number),
      })
      .from(events)
      .where(
        and(
          eq(events.status, "open"),
          gte(events.eventDate, today),
          sql`NOT EXISTS (SELECT 1 FROM bookings AS b WHERE b.event_id = ${events}.id AND b.user_id = ${userId} AND b.status <> 'cancelled')`,
        ),
      )
      .orderBy(asc(events.eventDate))
      .limit(3),
  ]);

  return {
    upcoming,
    next: upcoming.find((b) => b.status !== "rejected" && b.eventStatus !== "cancelled") ?? null,
    needsAction: upcoming.filter((b) => b.status === "rejected" && b.eventStatus !== "cancelled"),
    profileComplete: !!(profile?.phone && profile.emergencyName),
    openRaces,
  };
}

const n = (q: SQL) => sql<number>`${q}`.mapWith(Number);

export async function getOrganizerDashboard(actor: CurrentUser) {
  await connection();
  const today = todayInManila();
  const mine = actor.role === "admin" ? undefined : eq(events.organizerId, actor.id);

  const races = await db
    .select({
      id: events.id,
      title: events.title,
      eventDate: events.eventDate,
      status: events.status,
      capacity: events.capacity,
      approved: n(sql`(SELECT COUNT(*) FROM bookings AS b WHERE b.event_id = ${events}.id AND b.status = 'approved')`),
      pending: n(sql`(SELECT COUNT(*) FROM bookings AS b WHERE b.event_id = ${events}.id AND b.status = 'pending')`),
      checkedIn: n(sql`(SELECT COUNT(*) FROM bookings AS b WHERE b.event_id = ${events}.id AND b.attended = 1)`),
      collected: n(sql`(SELECT COALESCE(SUM(b.price), 0) FROM bookings AS b WHERE b.event_id = ${events}.id AND b.status = 'approved')`),
    })
    .from(events)
    .where(and(mine, gte(events.eventDate, today)))
    .orderBy(asc(events.eventDate));

  const totals = races.reduce(
    (t, r) => ({
      pending: t.pending + r.pending,
      approved: t.approved + r.approved,
      collected: t.collected + r.collected,
      open: t.open + (r.status === "open" ? 1 : 0),
    }),
    { pending: 0, approved: 0, collected: 0, open: 0 },
  );
  return { races, totals };
}

export async function getAdminTotals() {
  await connection();
  const [roles, [banned], statuses, [revenue]] = await Promise.all([
    db.select({ role: user.role, total: count() }).from(user).groupBy(user.role),
    db.select({ total: count() }).from(user).where(eq(user.banned, true)),
    db.select({ status: bookings.status, total: count() }).from(bookings).groupBy(bookings.status),
    db.select({ total: sum(bookings.price).mapWith(Number) }).from(bookings).where(eq(bookings.status, "approved")),
  ]);
  const byRole = Object.fromEntries(roles.map((r) => [r.role, r.total])) as Record<string, number>;
  const byStatus = Object.fromEntries(statuses.map((s) => [s.status, s.total])) as Record<string, number>;
  return {
    users: roles.reduce((t, r) => t + r.total, 0),
    runners: byRole.runner ?? 0,
    organizers: byRole.organizer ?? 0,
    admins: byRole.admin ?? 0,
    banned: banned?.total ?? 0,
    bookings: byStatus,
    revenue: revenue?.total ?? 0,
  };
}
