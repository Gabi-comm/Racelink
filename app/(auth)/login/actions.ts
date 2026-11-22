"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user as users } from "@/lib/db/schema";
import { homeFor, isRole, safeNext } from "@/lib/roles";

export type AuthState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password" | "confirm", string>>;
  values?: { name?: string; email?: string };
};

const email = z.email("Enter a valid email address.").trim().toLowerCase();

const logInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

const signUpSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name.").max(100, "Name is too long."),
    email,
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .refine((p) => new TextEncoder().encode(p).length <= 72, "Password is too long."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match." });

function fieldErrors(error: z.ZodError): AuthState["fieldErrors"] {
  const out: AuthState["fieldErrors"] = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof NonNullable<AuthState["fieldErrors"]>;
    out[key] ??= issue.message;
  }
  return out;
}

export async function logIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  const raw = { email: String(form.get("email") ?? ""), password: String(form.get("password") ?? "") };
  const values = { email: raw.email };
  const parsed = logInSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  let userId: string;
  try {
    const res = await auth.api.signInEmail({ body: parsed.data, headers: await headers() });
    userId = res.user.id;
  } catch (err) {
    if (err instanceof APIError && err.status === "UNAUTHORIZED") {
      return { error: "Wrong email or password.", values };
    }
    if (err instanceof APIError && err.status === "FORBIDDEN") {
      return { error: "This account has been suspended. Contact the RaceLink team.", values };
    }
    console.error(err);
    return { error: "Couldn't log you in. Try again in a moment.", values };
  }

  redirect(await destination(userId, form.get("next")));
}

// requested page if any, else the role's home
async function destination(userId: string, next: FormDataEntryValue | null) {
  const target = safeNext(next);
  if (target && target !== "/") return target;
  const [row] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  return homeFor(isRole(row?.role) ? row.role : "runner");
}

export async function signUp(_prev: AuthState, form: FormData): Promise<AuthState> {
  const raw = {
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
    confirm: String(form.get("confirm") ?? ""),
  };
  const values = { name: raw.name, email: raw.email };
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const { name, email, password } = parsed.data;
  let userId: string;
  try {
    const res = await auth.api.signUpEmail({ body: { name, email, password }, headers: await headers() });
    userId = res.user.id;
  } catch (err) {
    if (err instanceof APIError && err.status === "UNPROCESSABLE_ENTITY") {
      return { fieldErrors: { email: "An account with this email already exists. Log in instead." }, values };
    }
    console.error(err);
    return { error: "Couldn't create your account. Try again in a moment.", values };
  }

  redirect(await destination(userId, form.get("next")));
}

// logout is the only way back to the public site
export async function logOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
