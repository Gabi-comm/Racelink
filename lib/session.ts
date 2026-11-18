import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isRole, type Role } from "@/lib/roles";

export type CurrentUser = { id: string; name: string; email: string; role: Role };

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.banned) return null;
  const { id, name, email, role } = session.user;
  return { id, name, email, role: isRole(role) ? role : "runner" };
});

export async function requireUser(...roles: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (roles.length > 0 && !roles.includes(user.role)) forbidden();
  return user;
}
