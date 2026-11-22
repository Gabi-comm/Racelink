import "server-only";
import { connection } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, raceRequests, user } from "@/lib/db/schema";
import type { RequestStatus } from "@/lib/constants";

// shared queue: every organizer and admin sees all requests

export async function getPendingRequestCount() {
  await connection();
  const [row] = await db.select({ n: count() }).from(raceRequests).where(eq(raceRequests.status, "pending"));
  return row?.n ?? 0;
}

export async function getRequests(status: RequestStatus) {
  await connection();
  const [list, counts] = await Promise.all([
    db
      .select({
        id: raceRequests.id,
        organization: raceRequests.organization,
        contactName: raceRequests.contactName,
        email: raceRequests.email,
        phone: raceRequests.phone,
        raceTitle: raceRequests.raceTitle,
        proposedDate: raceRequests.proposedDate,
        location: raceRequests.location,
        expectedRunners: raceRequests.expectedRunners,
        distances: raceRequests.distances,
        message: raceRequests.message,
        status: raceRequests.status,
        reviewNote: raceRequests.reviewNote,
        reviewedAt: raceRequests.reviewedAt,
        reviewerName: user.name,
        eventId: raceRequests.eventId,
        eventTitle: events.title,
        createdAt: raceRequests.createdAt,
      })
      .from(raceRequests)
      .leftJoin(user, eq(user.id, raceRequests.reviewedBy))
      .leftJoin(events, eq(events.id, raceRequests.eventId))
      .where(eq(raceRequests.status, status))
      .orderBy(status === "pending" ? raceRequests.createdAt : desc(raceRequests.reviewedAt)),
    db.select({ status: raceRequests.status, n: count() }).from(raceRequests).groupBy(raceRequests.status),
  ]);
  const by = Object.fromEntries(counts.map((c) => [c.status, c.n])) as Partial<Record<RequestStatus, number>>;
  return { list, counts: { pending: by.pending ?? 0, approved: by.approved ?? 0, rejected: by.rejected ?? 0 } };
}

export type RaceRequestRow = Awaited<ReturnType<typeof getRequests>>["list"][number];
