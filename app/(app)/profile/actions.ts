"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { strongPassword } from "@/lib/password";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { fieldErrors, readForm, runnerDetailsSchema, type FormState } from "@/lib/booking-form";
import { db } from "@/lib/db";
import { runnerProfiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/session";

export type ProfileState = FormState & { ok?: string };

const nameSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(100, "Name is too long."),
});

export async function saveName(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session ended. Log in again." };
  const parsed = nameSchema.safeParse(readForm(form, ["name"]));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  await auth.api.updateUser({ body: { name: parsed.data.name }, headers: await headers() });
  revalidatePath("/", "layout");
  return { ok: "Name saved." };
}

const detailsSchema = runnerDetailsSchema.extend({
  address: z
    .string()
    .trim()
    .max(255, "Keep the address under 255 characters.")
    .transform((v) => v || null),
});

export async function saveDetails(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session ended. Log in again." };
  const parsed = detailsSchema.safeParse(
    readForm(form, ["phone", "address", "birthdate", "gender", "emergencyName", "emergencyPhone"]),
  );
  if (!parsed.success) return { error: "Some details need fixing.", fieldErrors: fieldErrors(parsed.error) };

  await db
    .insert(runnerProfiles)
    .values({ userId: user.id, ...parsed.data })
    .onDuplicateKeyUpdate({ set: parsed.data });
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: "Runner details saved." };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: strongPassword,
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, { path: ["confirm"], message: "Passwords don't match." })
  .refine((d) => d.newPassword !== d.currentPassword, { path: ["newPassword"], message: "Pick a password you haven't used here." });

export async function changePassword(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session ended. Log in again." };
  const parsed = passwordSchema.safeParse(readForm(form, ["currentPassword", "newPassword", "confirm"]));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  // keep this session, logout other devices
  const h = await headers();
  try {
    await auth.api.changePassword({
      body: { currentPassword: parsed.data.currentPassword, newPassword: parsed.data.newPassword },
      headers: h,
    });
    await auth.api.revokeOtherSessions({ headers: h });
  } catch (err) {
    if (err instanceof APIError && (err.body?.code === "INVALID_PASSWORD" || err.status === "BAD_REQUEST")) {
      return { fieldErrors: { currentPassword: "That's not your current password." } };
    }
    console.error(err);
    return { error: "Couldn't change your password. Try again in a moment." };
  }
  return { ok: "Password changed. Other devices were signed out." };
}
