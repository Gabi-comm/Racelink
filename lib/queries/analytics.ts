import "server-only";
import { connection } from "next/server";
import { and, asc, count, eq, gte, inArray, lt, ne, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, events, raceRequests, runnerProfiles, TSHIRT_SIZES } from "@/lib/db/schema";
import { todayInManila } from "@/lib/events";
import type { CurrentUser } from "@/lib/session";

const num = (q: SQL) => sql<number>`${q}`.mapWith(Number);

// monday of the week, as YYYY-MM-DD
function weekStart(d: Date) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
  return x.toISOString().slice(0, 10);
}

export async function getOrganizerAnalytics(actor: CurrentUser) {
  await connection();
  const today = todayInManila();
  const mine = actor.role === "admin" ? undefined : eq(events.organizerId, actor.id);
  const live = ne(bookings.status, "cancelled");

  const weeks = 12;
  const firstWeek = new Date(`${weekStart(new Date())}T00:00:00Z`);
  firstWeek.setUTCDate(firstWeek.getUTCDate() - 7 * (weeks - 1));
  const sinceWeek = firstWeek.toISOString().slice(0, 10);

  const months = 6;
  const now = new Date();
  const monthKeys = Array.from({ length: months }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1 - i), 1));
    return d.toISOString().slice(0, 7);
  });

  const [raceRows, statusRows, weekly, monthly, distances, sizes, genders, [requests], [pastCheckIn]] = await Promise.all([
    db
      .select({
        id: events.id,
        title: events.title,
        eventDate: events.eventDate,
        status: events.status,
        capacity: events.capacity,
        approved: num(sql`(SELECT COUNT(*) FROM bookings AS b WHERE b.event_id = ${events}.id AND b.status = 'approved')`),
        pending: num(sql`(SELECT COUNT(*) FROM bookings AS b WHERE b.event_id = ${events}.id AND b.status = 'pending')`),
      })
      .from(events)
      .where(mine)
      .orderBy(asc(events.eventDate)),
    db
      .select({ status: bookings.status, n: count(), fees: num(sql`COALESCE(SUM(${bookings.price}), 0)`) })
      .from(bookings)
      .innerJoin(events, eq(events.id, bookings.eventId))
      .where(mine)
      .groupBy(bookings.status),
    db
      .select({
        week: sql<string>`DATE_FORMAT(DATE_SUB(DATE(${bookings.createdAt}), INTERVAL WEEKDAY(${bookings.createdAt}) DAY), '%Y-%m-%d')`,
        n: count(),
      })
      .from(bookings)
      .innerJoin(events, eq(events.id, bookings.eventId))
      .where(and(mine, live, gte(bookings.createdAt, new Date(`${sinceWeek}T00:00:00Z`))))
      .groupBy(sql`1`),
    db
      .select({ month: sql<string>`DATE_FORMAT(${bookings.createdAt}, '%Y-%m')`, fees: num(sql`COALESCE(SUM(${bookings.price}), 0)`) })
      .from(bookings)
      .innerJoin(events, eq(events.id, bookings.eventId))
      .where(and(mine, eq(bookings.status, "approved"), gte(bookings.createdAt, new Date(`${monthKeys[0]}-01T00:00:00Z`))))
      .groupBy(sql`1`),
    db
      .select({ label: bookings.distanceLabel, n: count() })
      .from(bookings)
      .innerJoin(events, eq(events.id, bookings.eventId))
      .where(and(mine, inArray(bookings.status, ["approved", "pending"])))
      .groupBy(bookings.distanceLabel),
    db
      .select({ size: bookings.tshirtSize, n: count() })
      .from(bookings)
      .innerJoin(events, eq(events.id, bookings.eventId))
      .where(and(mine, eq(bookings.status, "approved"), gte(events.eventDate, today)))
      .groupBy(bookings.tshirtSize),
    db
      .select({ gender: runnerProfiles.gender, n: count() })
      .from(bookings)
      .innerJoin(events, eq(events.id, bookings.eventId))
      .leftJoin(runnerProfiles, eq(runnerProfiles.userId, bookings.userId))
      .where(and(mine, eq(bookings.status, "approved")))
      .groupBy(runnerProfiles.gender),
    db.select({ n: count() }).from(raceRequests).where(eq(raceRequests.status, "pending")),
    db
      .select({
        approved: count(),
        attended: num(sql`COALESCE(SUM(${bookings.attended}), 0)`),
      })
      .from(bookings)
      .innerJoin(events, eq(events.id, bookings.eventId))
      .where(and(mine, eq(bookings.status, "approved"), lt(events.eventDate, today))),
  ]);

  const byStatus = Object.fromEntries(statusRows.map((r) => [r.status, r])) as Partial<
    Record<(typeof statusRows)[number]["status"], (typeof statusRows)[number]>
  >;

  const upcoming = raceRows.filter((r) => r.eventDate >= today && r.status !== "cancelled");
  const weekMap = new Map(weekly.map((w) => [w.week, w.n]));
  const monthMap = new Map(monthly.map((m) => [m.month, m.fees]));

  return {
    kpis: {
      racesOpen: raceRows.filter((r) => r.status === "open" && r.eventDate >= today).length,
      racesUpcoming: upcoming.length,
      racesFinished: raceRows.filter((r) => r.eventDate < today).length,
      registrations: (byStatus.approved?.n ?? 0) + (byStatus.pending?.n ?? 0) + (byStatus.rejected?.n ?? 0),
      confirmed: byStatus.approved?.n ?? 0,
      pending: byStatus.pending?.n ?? 0,
      rejected: byStatus.rejected?.n ?? 0,
      fees: byStatus.approved?.fees ?? 0,
      pendingFees: byStatus.pending?.fees ?? 0,
      checkInRate: pastCheckIn && pastCheckIn.approved > 0 ? Math.round((pastCheckIn.attended / pastCheckIn.approved) * 100) : null,
      pendingRequests: requests?.n ?? 0,
    },
    weekly: Array.from({ length: weeks }, (_, i) => {
      const d = new Date(firstWeek);
      d.setUTCDate(d.getUTCDate() + 7 * i);
      const key = d.toISOString().slice(0, 10);
      return { week: key, registrations: weekMap.get(key) ?? 0 };
    }),
    feesByMonth: monthKeys.map((m) => ({ month: m, fees: monthMap.get(m) ?? 0 })),
    upcoming: upcoming.map((r) => ({
      id: r.id,
      title: r.title,
      eventDate: r.eventDate,
      status: r.status,
      capacity: r.capacity,
      confirmed: r.approved,
      pending: r.pending,
    })),
    distances: distances
      .map((d) => ({ label: d.label, runners: d.n }))
      .sort((a, b) => b.runners - a.runners),
    sizes: trimZeros(TSHIRT_SIZES.map((s) => ({ label: s, runners: sizes.find((x) => x.size === s)?.n ?? 0 }))),
    genders: genders
      .map((g) => ({ label: g.gender ?? "Not given", runners: g.n }))
      .sort((a, b) => b.runners - a.runners),
  };
}

// sizes keep their natural order; drop empty sizes at both ends only
function trimZeros<T extends { runners: number }>(rows: T[]) {
  const first = rows.findIndex((r) => r.runners > 0);
  if (first === -1) return [];
  const last = rows.length - 1 - [...rows].reverse().findIndex((r) => r.runners > 0);
  return rows.slice(first, last + 1);
}

export type OrganizerAnalytics = Awaited<ReturnType<typeof getOrganizerAnalytics>>;
