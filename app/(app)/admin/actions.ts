"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as users } from "@/lib/db/schema";
import { ROLE_LABEL, isRole } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";

type Result = { ok: true; message: string } | { ok: false; error: string };

async function admin() {
  const u = await getCurrentUser();
  return u?.role === "admin" ? u : null;
}

async function target(id: string) {
  const [row] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, id)).limit(1);
  return row ?? null;
}

export async function changeRole(userId: string, role: string): Promise<Result> {
  const me = await admin();
  if (!me) return { ok: false, error: "Only admins can change roles." };
  if (!isRole(role)) return { ok: false, error: "Pick a valid role." };
  if (userId === me.id) return { ok: false, error: "You can't change your own role. Ask another admin." };
  const t = await target(userId);
  if (!t) return { ok: false, error: "That user no longer exists." };

  await db.update(users).set({ role }).where(eq(users.id, userId));
  revalidatePath("/admin");
  return { ok: true, message: `${t.name} is now ${role === "runner" ? "a" : "an"} ${ROLE_LABEL[role].toLowerCase()}.` };
}

const reasonSchema = z.string().trim().min(3, "Give a short reason, at least 3 characters.").max(255);

export async function banUser(userId: string, reason: string): Promise<Result> {
  const me = await admin();
  if (!me) return { ok: false, error: "Only admins can ban users." };
  if (userId === me.id) return { ok: false, error: "You can't ban yourself." };
  const parsed = reasonSchema.safeParse(reason);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const t = await target(userId);
  if (!t) return { ok: false, error: "That user no longer exists." };

  await auth.api.banUser({ body: { userId, banReason: parsed.data }, headers: await headers() });
  revalidatePath("/admin");
  return { ok: true, message: `${t.name} is banned and signed out.` };
}

export async function unbanUser(userId: string): Promise<Result> {
  const me = await admin();
  if (!me) return { ok: false, error: "Only admins can unban users." };
  const t = await target(userId);
  if (!t) return { ok: false, error: "That user no longer exists." };

  await auth.api.unbanUser({ body: { userId }, headers: await headers() });
  revalidatePath("/admin");
  return { ok: true, message: `${t.name} can log in again.` };
}
