"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { bookings, events, paymentProofs, refundRequests } from "@/lib/db/schema";
import { managedBooking } from "@/lib/queries/registrations";
import { canManageEvents } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";

type Result = { ok: true; message: string } | { ok: false; error: string };

class Refused extends Error {}

async function reviewer() {
  const user = await getCurrentUser();
  return user && canManageEvents(user.role) ? user : null;
}

function refresh(eventId: number) {
  revalidatePath(`/organizer/events/${eventId}/registrations`);
  revalidatePath("/organizer");
  revalidatePath("/organizer/participants");
  revalidatePath("/organizer/events");
  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  revalidatePath("/");
}

async function latestProofId(tx: Pick<typeof db, "select">, bookingId: number) {
  const [p] = await tx
    .select({ id: paymentProofs.id })
    .from(paymentProofs)
    .where(eq(paymentProofs.bookingId, bookingId))
    .orderBy(desc(paymentProofs.id))
    .limit(1);
  return p?.id ?? null;
}

export async function approveBooking(bookingId: number): Promise<Result> {
  const user = await reviewer();
  if (!user) return { ok: false, error: "Only organizers can review payments." };
  const booking = await managedBooking(user, bookingId);
  if (!booking) return { ok: false, error: "That registration doesn't exist or isn't for your race." };

  try {
    const bib = await db.transaction(async (tx) => {
      // lock event para walang duplicate bib
      await tx.select({ id: events.id }).from(events).where(eq(events.id, booking.eventId)).for("update");
      const [b] = await tx
        .select({ status: bookings.status })
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .for("update");
      if (b?.status !== "pending") throw new Refused("This registration was already reviewed. Refresh to see its status.");

      const [{ next }] = await tx
        .select({ next: sql<number>`COALESCE(MAX(${bookings.bibNumber}), 1000) + 1`.mapWith(Number) })
        .from(bookings)
        .where(eq(bookings.eventId, booking.eventId));

      await tx.update(bookings).set({ status: "approved", bibNumber: next }).where(eq(bookings.id, bookingId));
      const proofId = await latestProofId(tx, bookingId);
      if (proofId) {
        await tx
          .update(paymentProofs)
          .set({ status: "approved", reviewNote: null, reviewedBy: user.id, reviewedAt: new Date() })
          .where(eq(paymentProofs.id, proofId));
      }
      return next;
    });
    refresh(booking.eventId);
    return { ok: true, message: `Approved. Bib ${String(bib).padStart(4, "0")} assigned.` };
  } catch (e) {
    if (e instanceof Refused) return { ok: false, error: e.message };
    throw e;
  }
}

const noteSchema = z
  .string()
  .trim()
  .min(5, "Tell the runner what's wrong, at least 5 characters.")
  .max(255, "Keep the reason under 255 characters.");

export async function rejectBooking(bookingId: number, note: string): Promise<Result> {
  const user = await reviewer();
  if (!user) return { ok: false, error: "Only organizers can review payments." };
  const parsed = noteSchema.safeParse(note);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const booking = await managedBooking(user, bookingId);
  if (!booking) return { ok: false, error: "That registration doesn't exist or isn't for your race." };

  try {
    await db.transaction(async (tx) => {
      const [b] = await tx
        .select({ status: bookings.status })
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .for("update");
      if (b?.status !== "pending") throw new Refused("This registration was already reviewed. Refresh to see its status.");

      await tx.update(bookings).set({ status: "rejected" }).where(eq(bookings.id, bookingId));
      const proofId = await latestProofId(tx, bookingId);
      if (proofId) {
        await tx
          .update(paymentProofs)
          .set({ status: "rejected", reviewNote: parsed.data, reviewedBy: user.id, reviewedAt: new Date() })
          .where(eq(paymentProofs.id, proofId));
      }
    });
    refresh(booking.eventId);
    return { ok: true, message: "Payment rejected. The runner can send a new receipt." };
  } catch (e) {
    if (e instanceof Refused) return { ok: false, error: e.message };
    throw e;
  }
}

// para sa accidental approve: balik sa To review, bitawan ang bib
export async function undoApproval(bookingId: number): Promise<Result> {
  const user = await reviewer();
  if (!user) return { ok: false, error: "Only organizers can review payments." };
  const booking = await managedBooking(user, bookingId);
  if (!booking) return { ok: false, error: "That registration doesn't exist or isn't for your race." };

  try {
    const bib = await db.transaction(async (tx) => {
      const [b] = await tx
        .select({ status: bookings.status, bibNumber: bookings.bibNumber })
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .for("update");
      if (b?.status !== "approved") throw new Refused("This runner isn't confirmed anymore. Refresh to see its status.");

      await tx
        .update(bookings)
        .set({ status: "pending", bibNumber: null, attended: false, checkedInAt: null })
        .where(eq(bookings.id, bookingId));
      const proofId = await latestProofId(tx, bookingId);
      if (proofId) {
        await tx
          .update(paymentProofs)
          .set({ status: "pending", reviewNote: null, reviewedBy: null, reviewedAt: null })
          .where(eq(paymentProofs.id, proofId));
      }
      return b.bibNumber;
    });
    refresh(booking.eventId);
    return {
      ok: true,
      message: bib !== null ? `Moved back to To review. Bib ${String(bib).padStart(4, "0")} released.` : "Moved back to To review.",
    };
  } catch (e) {
    if (e instanceof Refused) return { ok: false, error: e.message };
    throw e;
  }
}

const bibSchema = z.number().int("Bib numbers are whole numbers.").min(1, "Bib numbers start at 1.").max(99999, "Keep bib numbers to 5 digits.");

export async function setBib(bookingId: number, bib: number): Promise<Result> {
  const user = await reviewer();
  if (!user) return { ok: false, error: "Only organizers can assign bibs." };
  const parsed = bibSchema.safeParse(bib);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const booking = await managedBooking(user, bookingId);
  if (!booking) return { ok: false, error: "That registration doesn't exist or isn't for your race." };
  if (booking.status !== "approved") return { ok: false, error: "Approve the payment first. Only confirmed runners get a bib." };

  try {
    await db.transaction(async (tx) => {
      await tx.select({ id: events.id }).from(events).where(eq(events.id, booking.eventId)).for("update");
      const [taken] = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(and(eq(bookings.eventId, booking.eventId), eq(bookings.bibNumber, parsed.data), ne(bookings.id, bookingId)))
        .limit(1);
      if (taken) throw new Refused(`Bib ${String(parsed.data).padStart(4, "0")} is already taken in this race.`);
      await tx.update(bookings).set({ bibNumber: parsed.data }).where(eq(bookings.id, bookingId));
    });
  } catch (e) {
    if (e instanceof Refused) return { ok: false, error: e.message };
    throw e;
  }
  refresh(booking.eventId);
  return { ok: true, message: `Bib set to ${String(parsed.data).padStart(4, "0")}.` };
}

export async function processRefund(refundId: number): Promise<Result> {
  const user = await reviewer();
  if (!user) return { ok: false, error: "Only organizers can process refunds." };
  const [refund] = await db
    .select({ bookingId: refundRequests.bookingId })
    .from(refundRequests)
    .where(eq(refundRequests.id, refundId))
    .limit(1);
  const booking = refund ? await managedBooking(user, refund.bookingId) : null;
  if (!booking) return { ok: false, error: "That refund request doesn't exist or isn't for your race." };

  const res = await db
    .update(refundRequests)
    .set({ status: "processed", processedBy: user.id, processedAt: new Date() })
    .where(and(eq(refundRequests.id, refundId), eq(refundRequests.status, "requested")));
  if (res[0].affectedRows === 0) return { ok: false, error: "This refund was already processed. Refresh to see its status." };

  refresh(booking.eventId);
  return { ok: true, message: "Refund marked as processed." };
}
