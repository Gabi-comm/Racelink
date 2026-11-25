"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user as users } from "@/lib/db/schema";
import { strongPassword } from "@/lib/password";
import { homeFor, isRole, safeNext } from "@/lib/roles";

export type AuthState = {
  error?: string;
  // info box (not an error), e.g. "check your email"
  notice?: string;
  // sign-up / forgot password done: the address the link went to
  sentTo?: string;
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
    password: strongPassword,
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
    // sendOnSignIn already mailed a fresh link
    if (err instanceof APIError && err.body?.code === "EMAIL_NOT_VERIFIED") {
      return { notice: `Verify your email first. We sent a new link to ${parsed.data.email}. Check your inbox and spam folder.`, values };
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
  // the email link lands on /login, which sends a signed-in runner on to `next`
  const next = safeNext(form.get("next"));
  const callbackURL = `/login?verified=1${next && next !== "/" ? `&next=${encodeURIComponent(next)}` : ""}`;
  try {
    await auth.api.signUpEmail({ body: { name, email, password, callbackURL }, headers: await headers() });
  } catch (err) {
    if (err instanceof APIError && err.status === "UNPROCESSABLE_ENTITY") {
      return { fieldErrors: { email: "An account with this email already exists. Log in instead." }, values };
    }
    if (err instanceof APIError && err.body?.code === "WEAK_PASSWORD") {
      return { fieldErrors: { password: err.body.message ?? "Pick a stronger password." }, values };
    }
    console.error(err);
    return { error: "Couldn't create your account. Try again in a moment.", values };
  }

  // no session yet: they log in by clicking the link in the email
  return { sentTo: email };
}

const forgotSchema = z.object({ email });

export async function forgotPassword(_prev: AuthState, form: FormData): Promise<AuthState> {
  const raw = { email: String(form.get("email") ?? "") };
  const parsed = forgotSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: raw };
  try {
    await auth.api.requestPasswordReset({ body: { email: parsed.data.email, redirectTo: "/reset-password" }, headers: await headers() });
  } catch (err) {
    console.error(err);
    return { error: "Couldn't send the reset link. Try again in a moment.", values: raw };
  }
  // same answer whether or not the account exists
  return { sentTo: parsed.data.email };
}

const resetSchema = z
  .object({ token: z.string().min(1), password: strongPassword, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match." });

export async function resetPassword(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = resetSchema.safeParse({
    token: String(form.get("token") ?? ""),
    password: String(form.get("password") ?? ""),
    confirm: String(form.get("confirm") ?? ""),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  try {
    await auth.api.resetPassword({ body: { token: parsed.data.token, newPassword: parsed.data.password }, headers: await headers() });
  } catch (err) {
    if (err instanceof APIError && err.body?.code === "WEAK_PASSWORD") {
      return { fieldErrors: { password: err.body.message ?? "Pick a stronger password." } };
    }
    if (err instanceof APIError && err.body?.code === "INVALID_TOKEN") {
      return { error: "This reset link has expired or was already used. Ask for a new one from the log in screen." };
    }
    console.error(err);
    return { error: "Couldn't reset your password. Try again in a moment." };
  }
  redirect("/login?reset=1");
}

// logout is the only way back to the public site
export async function logOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
