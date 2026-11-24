"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { bookings, eventDistances, events, eventSizes, paymentProofs, refundRequests, runnerProfiles } from "@/lib/db/schema";
import { fieldErrors, phone, readForm, registerSchema, resubmitSchema, type FormState } from "@/lib/booking-form";
import { registrationBlock } from "@/lib/queries/bookings";
import { hasAcceptedTerms } from "@/lib/queries/terms";
import { getCurrentUser } from "@/lib/session";
import { deleteFile } from "@/lib/storage";
import { ownsKey } from "@/lib/uploads";

class Refused extends Error {}

const REGISTER_KEYS = ["distanceId", "tshirtSize", "phone", "birthdate", "gender", "emergencyName", "emergencyPhone", "receiptKey", "referenceNo"];

function refresh() {
  revalidatePath("/");
  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  revalidatePath("/organizer");
}

export async function register(eventId: number, _prev: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session ended. Log in again to register." };
  if (!(await hasAcceptedTerms(user.id))) return { error: "Accept the Terms and Conditions first. Reload the page to see them." };

  const parsed = registerSchema.safeParse(readForm(form, REGISTER_KEYS));
  if (!parsed.success) {
    return { error: "Some details need fixing. Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }
  const d = parsed.data;
  if (!ownsKey("receipt", user.id, d.receiptKey)) {
    return { fieldErrors: { receiptKey: "Upload your receipt again." }, error: "Your receipt upload isn't valid." };
  }

  let bookingId: number;
  try {
    bookingId = await db.transaction(async (tx) => {
      // lock the race row so two runners can't take the last slot at the same time
      const [event] = await tx
        .select({ id: events.id, status: events.status, registrationCloses: events.registrationCloses, capacity: events.capacity })
        .from(events)
        .where(eq(events.id, eventId))
        .for("update");
      if (!event) throw new Refused("That race doesn't exist anymore.");

      const [{ n: registered }] = await tx
        .select({ n: count() })
        .from(bookings)
        .where(and(eq(bookings.eventId, eventId), inArray(bookings.status, ["pending", "approved"])));
      const blocked = registrationBlock({ ...event, registered });
      if (blocked) throw new Refused(blocked);

      const [distance] = await tx
        .select()
        .from(eventDistances)
        .where(and(eq(eventDistances.id, d.distanceId), eq(eventDistances.eventId, eventId)));
      if (!distance) throw new Refused("That distance isn't offered anymore. Pick another one.");
      if (distance.slots !== null) {
        const [{ n }] = await tx
          .select({ n: count() })
          .from(bookings)
          .where(and(eq(bookings.distanceId, distance.id), inArray(bookings.status, ["pending", "approved"])));
        if (n >= distance.slots) throw new Refused(`The ${distance.label} slots are full. Pick another distance.`);
      }

      const [size] = await tx
        .select({ id: eventSizes.id })
        .from(eventSizes)
        .where(and(eq(eventSizes.eventId, eventId), eq(eventSizes.size, d.tshirtSize)));
      if (!size) throw new Refused("That shirt size isn't available. Pick another one.");

      const [existing] = await tx
        .select({ id: bookings.id, status: bookings.status })
        .from(bookings)
        .where(and(eq(bookings.eventId, eventId), eq(bookings.userId, user.id)));
      if (existing && existing.status !== "cancelled") throw new Refused("You're already registered for this race.");
      if (existing) {
        const [refund] = await tx
          .select({ status: refundRequests.status })
          .from(refundRequests)
          .where(eq(refundRequests.bookingId, existing.id))
          .orderBy(desc(refundRequests.id))
          .limit(1);
        if (refund?.status === "requested") throw new Refused("Your refund for this race is still being reviewed. Register again once it's processed.");
      }

      const values = {
        distanceId: distance.id,
        distanceLabel: distance.label,
        price: distance.price,
        tshirtSize: d.tshirtSize,
        status: "pending" as const,
        bibNumber: null,
        attended: false,
        checkedInAt: null,
        createdAt: new Date(),
      };
      let id: number;
      if (existing) {
        id = existing.id;
        await tx.update(bookings).set(values).where(eq(bookings.id, id));
      } else {
        const [res] = await tx.insert(bookings).values({ ...values, userId: user.id, eventId }).$returningId();
        id = res.id;
      }

      await tx.insert(paymentProofs).values({ bookingId: id, fileKey: d.receiptKey, amount: distance.price, referenceNo: d.referenceNo });

      const profile = {
        phone: d.phone,
        birthdate: d.birthdate,
        gender: d.gender,
        emergencyName: d.emergencyName,
        emergencyPhone: d.emergencyPhone,
      };
      await tx.insert(runnerProfiles).values({ userId: user.id, ...profile }).onDuplicateKeyUpdate({ set: profile });
      return id;
    });
  } catch (err) {
    if (err instanceof Refused) return { error: err.message };
    console.error(err);
    return { error: "Couldn't save your registration. Try again in a moment." };
  }

  refresh();
  redirect(`/bookings?registered=${bookingId}#booking-${bookingId}`);
}

export async function resubmitPayment(bookingId: number, _prev: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session ended. Log in again." };

  const parsed = resubmitSchema.safeParse(readForm(form, ["receiptKey", "referenceNo"]));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  if (!ownsKey("receipt", user.id, parsed.data.receiptKey)) return { fieldErrors: { receiptKey: "Upload your receipt again." } };

  const [booking] = await db
    .select({ id: bookings.id, status: bookings.status, price: bookings.price })
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, user.id)));
  if (!booking) return { error: "That booking doesn't exist." };
  if (booking.status !== "rejected") return { error: "Only rejected payments can be sent again." };

  await db.transaction(async (tx) => {
    await tx.insert(paymentProofs).values({
      bookingId,
      fileKey: parsed.data.receiptKey,
      amount: booking.price,
      referenceNo: parsed.data.referenceNo,
    });
    await tx.update(bookings).set({ status: "pending" }).where(eq(bookings.id, bookingId));
  });

  refresh();
  return {};
}

export async function cancelBooking(bookingId: number): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Your session ended. Log in again." };

  const [booking] = await db
    .select({ id: bookings.id, status: bookings.status })
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, user.id)));
  if (!booking) return { ok: false, error: "That booking doesn't exist." };
  if (booking.status === "approved") {
    return { ok: false, error: "Your payment is already approved. Contact the organizer to cancel." };
  }
  if (booking.status === "cancelled") return { ok: true };

  const proofs = await db.select({ key: paymentProofs.fileKey }).from(paymentProofs).where(eq(paymentProofs.bookingId, bookingId));
  await db.transaction(async (tx) => {
    await tx.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, bookingId));
    await tx.delete(paymentProofs).where(eq(paymentProofs.bookingId, bookingId));
  });
  await Promise.all(proofs.map((p) => deleteFile(p.key)));

  refresh();
  return { ok: true };
}

const refundSchema = z.object({
  reason: z.string().trim().min(10, "Tell the organizer why, at least 10 characters.").max(500, "Keep the reason under 500 characters."),
  email: z.string().trim().email("Enter a valid email address.").max(255),
  phone: phone("mobile number"),
});
export type RefundFormState = { ok?: boolean; error?: string; fieldErrors?: Partial<Record<"reason" | "email" | "phone", string>> };

// cancels a paid booking and files a refund request in one step; the receipt is kept for the organizer
export async function requestRefund(bookingId: number, _prev: RefundFormState, form: FormData): Promise<RefundFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session ended. Log in again." };

  const parsed = refundSchema.safeParse({ reason: form.get("reason") ?? "", email: form.get("email") ?? "", phone: form.get("phone") ?? "" });
  if (!parsed.success) {
    const fe: RefundFormState["fieldErrors"] = {};
    for (const i of parsed.error.issues) {
      const k = i.path[0] as "reason" | "email" | "phone";
      fe[k] ??= i.message;
    }
    return { error: "Some details need fixing.", fieldErrors: fe };
  }

  try {
    await db.transaction(async (tx) => {
      const [b] = await tx
        .select({ id: bookings.id, status: bookings.status, price: bookings.price })
        .from(bookings)
        .where(and(eq(bookings.id, bookingId), eq(bookings.userId, user.id)))
        .for("update");
      if (!b) throw new Refused("That booking doesn't exist.");
      if (b.status !== "pending" && b.status !== "approved") {
        throw new Refused(b.status === "cancelled" ? "This registration is already cancelled." : "Only paid registrations can be refunded.");
      }
      const [proof] = await tx
        .select({ amount: paymentProofs.amount })
        .from(paymentProofs)
        .where(eq(paymentProofs.bookingId, bookingId))
        .orderBy(desc(paymentProofs.id))
        .limit(1);

      await tx.update(bookings).set({ status: "cancelled", bibNumber: null }).where(eq(bookings.id, bookingId));
      await tx.insert(refundRequests).values({ bookingId, ...parsed.data, amount: proof?.amount ?? b.price });
    });
  } catch (err) {
    if (err instanceof Refused) return { error: err.message };
    throw err;
  }

  refresh();
  revalidatePath("/organizer/participants");
  return { ok: true };
}
