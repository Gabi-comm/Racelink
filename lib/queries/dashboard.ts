import "server-only";
import { connection } from "next/server";
import { and, asc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, events, runnerProfiles } from "@/lib/db/schema";
import { todayInManila } from "@/lib/events";

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
        hasBanner: sql<number>`${events.bannerKey} IS NOT NULL`.mapWith(Boolean),
        distances: sql<string | null>`(SELECT GROUP_CONCAT(d.label ORDER BY d.price SEPARATOR '|') FROM event_distances AS d WHERE d.event_id = ${events}.id)`,
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
    openRaces: openRaces.map((r) => ({ ...r, distances: r.distances ? r.distances.split("|") : [] })),
  };
}
