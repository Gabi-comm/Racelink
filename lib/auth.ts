import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { db } from "@/lib/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "mysql" }),
  emailAndPassword: { enabled: true, minPasswordLength: 8, maxPasswordLength: 72 },
  session: { expiresIn: 60 * 60 * 24 * 7 },
  plugins: [admin({ defaultRole: "runner", adminRoles: ["admin"] }), nextCookies()],
});
