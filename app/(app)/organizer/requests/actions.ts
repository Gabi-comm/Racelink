"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { events, raceRequests } from "@/lib/db/schema";
import { canManageEvents } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";

type Result = { ok: true; message: string } | { ok: false; error: string };

class Refused extends Error {}

async function reviewer() {
  const user = await getCurrentUser();
  return user && canManageEvents(user.role) ? user : null;
}

function refresh() {
  revalidatePath("/organizer/requests");
  revalidatePath("/organizer/events");
  revalidatePath("/organizer");
}

// approve = new draft race owned by whoever approved it; the lock stops two organizers taking the same request
export async function approveRequest(requestId: number): Promise<Result> {
  const user = await reviewer();
  if (!user) return { ok: false, error: "Only organizers can approve race requests." };

  let eventId: number;
  try {
    eventId = await db.transaction(async (tx) => {
      const [req] = await tx.select().from(raceRequests).where(eq(raceRequests.id, requestId)).for("update");
      if (!req) throw new Refused("That request no longer exists.");
      if (req.status !== "pending") throw new Refused("Another organizer already reviewed this request. Refresh to see it.");

      const description =
        req.message && req.message.length >= 20
          ? req.message
          : `${req.raceTitle}, requested by ${req.organization}. Add the course, inclusions and race-day details here.`;
      const [res] = await tx
        .insert(events)
        .values({
          title: req.raceTitle,
          description,
          location: req.location,
          eventDate: req.proposedDate,
          capacity: req.expectedRunners,
          status: "draft",
          requestedBy: req.organization,
          requestId: req.id,
          organizerId: user.id,
        })
        .$returningId();

      await tx
        .update(raceRequests)
        .set({ status: "approved", reviewedBy: user.id, reviewedAt: new Date(), eventId: res.id, reviewNote: null })
        .where(eq(raceRequests.id, requestId));
      return res.id;
    });
  } catch (e) {
    if (e instanceof Refused) return { ok: false, error: e.message };
    throw e;
  }

  refresh();
  redirect(`/organizer/events/${eventId}?fromRequest=1`);
}

const noteSchema = z
  .string()
  .trim()
  .min(5, "Tell the organization why, at least 5 characters.")
  .max(255, "Keep the reason under 255 characters.");

export async function rejectRequest(requestId: number, note: string): Promise<Result> {
  const user = await reviewer();
  if (!user) return { ok: false, error: "Only organizers can reject race requests." };
  const parsed = noteSchema.safeParse(note);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  try {
    await db.transaction(async (tx) => {
      const [req] = await tx.select({ status: raceRequests.status }).from(raceRequests).where(eq(raceRequests.id, requestId)).for("update");
      if (!req) throw new Refused("That request no longer exists.");
      if (req.status !== "pending") throw new Refused("Another organizer already reviewed this request. Refresh to see it.");
      await tx
        .update(raceRequests)
        .set({ status: "rejected", reviewNote: parsed.data, reviewedBy: user.id, reviewedAt: new Date() })
        .where(eq(raceRequests.id, requestId));
    });
  } catch (e) {
    if (e instanceof Refused) return { ok: false, error: e.message };
    throw e;
  }

  refresh();
  return { ok: true, message: "Request rejected. Let the organization know by email." };
}
