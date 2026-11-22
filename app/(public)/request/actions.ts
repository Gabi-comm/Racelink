"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { raceRequests } from "@/lib/db/schema";
import { todayInManila } from "@/lib/events";
import { REQUEST_FIELDS, raceRequestSchema, type RaceRequestState } from "@/lib/request-form";

export async function submitRaceRequest(_prev: RaceRequestState, form: FormData): Promise<RaceRequestState> {
  // honeypot: bots fill every field, people never see this one
  if (String(form.get("website") ?? "") !== "") return { ok: true };

  const values = Object.fromEntries(REQUEST_FIELDS.map((f) => [f, String(form.get(f) ?? "")])) as Record<
    (typeof REQUEST_FIELDS)[number],
    string
  >;
  const parsed = raceRequestSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: RaceRequestState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as (typeof REQUEST_FIELDS)[number];
      fieldErrors[key] ??= issue.message;
    }
    return { error: "Some details need fixing. Check the highlighted fields.", fieldErrors, values };
  }
  if (parsed.data.proposedDate <= todayInManila()) {
    return { fieldErrors: { proposedDate: "Pick a date after today." }, values };
  }

  try {
    await db.insert(raceRequests).values(parsed.data);
  } catch (err) {
    console.error(err);
    return { error: "Couldn't send your request. Try again in a moment.", values };
  }

  revalidatePath("/organizer/requests");
  revalidatePath("/organizer");
  return { ok: true };
}
