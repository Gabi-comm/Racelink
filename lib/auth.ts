import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { db } from "@/lib/db";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/mail";
import { passwordProblem } from "@/lib/password";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "mysql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 72,
    // no login until the email link is clicked
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    // a reset logs out every other device
    revokeSessionsOnPasswordReset: true,
    // not awaited: same response time whether or not the email exists
    sendResetPassword: async ({ user, url }) => {
      void sendPasswordResetEmail(user.email, user.name, url).catch((e) => console.error("[mail] reset email failed", e));
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    // logging in unverified sends a fresh link
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: async ({ user, url }) => {
      void sendVerificationEmail(user.email, user.name, url).catch((e) => console.error("[mail] verification email failed", e));
    },
  },
  session: { expiresIn: 60 * 60 * 24 * 7 },
  // same password rule as the forms, so calling /api/auth directly can't skip it
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const field = ctx.path === "/sign-up/email" ? "password" : ctx.path === "/change-password" || ctx.path === "/reset-password" ? "newPassword" : null;
      if (!field) return;
      const value = (ctx.body as Record<string, unknown> | undefined)?.[field];
      const problem = typeof value === "string" ? passwordProblem(value) : "Enter a password.";
      if (problem) throw new APIError("BAD_REQUEST", { message: problem, code: "WEAK_PASSWORD" });
    }),
  },
  plugins: [admin({ defaultRole: "runner", adminRoles: ["admin"] }), nextCookies()],
});
