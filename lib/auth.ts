import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { db } from "@/lib/db";
import { passwordProblem } from "@/lib/password";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "mysql" }),
  emailAndPassword: { enabled: true, minPasswordLength: 8, maxPasswordLength: 72 },
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
