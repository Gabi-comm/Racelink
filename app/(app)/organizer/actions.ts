"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, eq, inArray, notInArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { bookings, eventDistances, eventDocuments, events, eventSizes } from "@/lib/db/schema";
import { eventSchema, flattenErrors, readEventForm, type EventFormState } from "@/lib/event-form";
import { canManageEvents } from "@/lib/roles";
import { getCurrentUser, type CurrentUser } from "@/lib/session";
import { deleteFile } from "@/lib/storage";
import { ownsKey } from "@/lib/uploads";

type Result = { ok: true } | { ok: false; error: string };

async function organizer(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  return user && canManageEvents(user.role) ? user : null;
}

// returns the event if this user may manage it
async function managedEvent(user: CurrentUser, id: number) {
  const [row] = await db
    .select({ id: events.id, organizerId: events.organizerId, bannerKey: events.bannerKey })
    .from(events)
    .where(eq(events.id, id))
    .limit(1);
  if (!row) return null;
  if (user.role !== "admin" && row.organizerId !== user.id) return null;
  return row;
}

function refresh(id?: number) {
  revalidatePath("/");
  revalidatePath("/races");
  revalidatePath("/organizer");
  revalidatePath("/organizer/events");
  if (id) revalidatePath(`/organizer/events/${id}`);
}

export async function saveEvent(_prev: EventFormState, form: FormData): Promise<EventFormState> {
  const user = await organizer();
  if (!user) return { error: "Only organizers can manage races. Log in with an organizer account." };

  const id = form.get("id") ? Number(form.get("id")) : null;
  const existing = id ? await managedEvent(user, id) : null;
  if (id && !existing) return { error: "That race doesn't exist or isn't yours to edit." };

  const parsed = eventSchema.safeParse(readEventForm(form));
  if (!parsed.success) {
    return { error: "Some details need fixing. Check the highlighted fields.", fieldErrors: flattenErrors(parsed.error) };
  }
  const data = parsed.data;

  // banner must be the old one or a fresh upload by this user
  const keepBanner = data.bannerKey === (existing?.bannerKey ?? null);
  if (!keepBanner && data.bannerKey && !ownsKey("banner", user.id, data.bannerKey)) {
    return { error: "That banner upload isn't valid. Upload the image again." };
  }

  const values = {
    title: data.title,
    description: data.description,
    location: data.location,
    eventDate: data.eventDate,
    startTime: data.startTime,
    registrationCloses: data.registrationCloses,
    capacity: data.capacity,
    paymentMethod: data.paymentMethod,
    paymentBank: data.paymentMethod === "bank" ? data.paymentBank : null,
    paymentAccountName: data.paymentAccountName,
    paymentAccountNumber: data.paymentAccountNumber,
    paymentInstructions: data.paymentInstructions,
    status: data.status,
    bannerKey: data.bannerKey,
    requestedBy: data.requestedBy,
  };

  let eventId: number;
  try {
    eventId = await db.transaction(async (tx) => {
      let eid: number;
      if (existing) {
        eid = existing.id;
        await tx.update(events).set(values).where(eq(events.id, eid));
      } else {
        const [res] = await tx.insert(events).values({ ...values, organizerId: user.id }).$returningId();
        eid = res.id;
      }

      // distances: update kept rows, add new, remove dropped (bookings keep their snapshot)
      const keptIds = data.distances.flatMap((d) => (d.id ? [d.id] : []));
      await tx
        .delete(eventDistances)
        .where(
          keptIds.length
            ? and(eq(eventDistances.eventId, eid), notInArray(eventDistances.id, keptIds))
            : eq(eventDistances.eventId, eid),
        );
      for (const d of data.distances) {
        const row = { label: d.label.replace(/\s/g, ""), price: d.price, slots: d.slots };
        if (d.id) await tx.update(eventDistances).set(row).where(and(eq(eventDistances.id, d.id), eq(eventDistances.eventId, eid)));
        else await tx.insert(eventDistances).values({ ...row, eventId: eid });
      }

      await tx.delete(eventSizes).where(eq(eventSizes.eventId, eid));
      await tx.insert(eventSizes).values(data.sizes.map((size) => ({ eventId: eid, size })));
      return eid;
    });
  } catch (err) {
    console.error(err);
    return { error: "Couldn't save the race. Try again in a moment." };
  }

  if (existing && !keepBanner) await deleteFile(existing.bannerKey);
  refresh(eventId);
  redirect(existing ? `/organizer/events/${eventId}?saved=1` : `/organizer/events/${eventId}?created=1`);
}

export async function deleteEvent(id: number): Promise<Result> {
  const user = await organizer();
  if (!user) return { ok: false, error: "Only organizers can delete races." };
  const event = await managedEvent(user, id);
  if (!event) return { ok: false, error: "That race doesn't exist or isn't yours to delete." };

  const [{ n }] = await db.select({ n: count() }).from(bookings).where(eq(bookings.eventId, id));
  if (n > 0) {
    return {
      ok: false,
      error: `This race has ${n} booking${n === 1 ? "" : "s"}, so it can't be deleted. Set its status to Cancelled instead.`,
    };
  }

  const docs = await db.select({ key: eventDocuments.fileKey }).from(eventDocuments).where(eq(eventDocuments.eventId, id));
  await db.delete(events).where(eq(events.id, id));
  await Promise.all([deleteFile(event.bannerKey), ...docs.map((d) => deleteFile(d.key))]);

  refresh();
  return { ok: true };
}

const documentSchema = z.object({
  title: z.string().trim().min(2, "Give the file a name, like Race map.").max(150),
  key: z.string(),
});

export async function addDocument(eventId: number, input: { title: string; key: string }): Promise<Result> {
  const user = await organizer();
  if (!user) return { ok: false, error: "Only organizers can add race files." };
  if (!(await managedEvent(user, eventId))) return { ok: false, error: "That race isn't yours to edit." };

  const parsed = documentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  if (!ownsKey("document", user.id, parsed.data.key)) return { ok: false, error: "Upload the file again." };

  await db.insert(eventDocuments).values({ eventId, title: parsed.data.title, fileKey: parsed.data.key, uploadedBy: user.id });
  refresh(eventId);
  return { ok: true };
}

export async function deleteDocument(eventId: number, docId: number): Promise<Result> {
  const user = await organizer();
  if (!user) return { ok: false, error: "Only organizers can remove race files." };
  if (!(await managedEvent(user, eventId))) return { ok: false, error: "That race isn't yours to edit." };

  const [doc] = await db
    .select({ key: eventDocuments.fileKey })
    .from(eventDocuments)
    .where(and(eq(eventDocuments.id, docId), eq(eventDocuments.eventId, eventId)));
  if (!doc) return { ok: false, error: "That file was already removed." };

  await db.delete(eventDocuments).where(inArray(eventDocuments.id, [docId]));
  await deleteFile(doc.key);
  refresh(eventId);
  return { ok: true };
}
