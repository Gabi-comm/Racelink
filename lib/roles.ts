import type { ROLES } from "@/lib/constants";

export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  runner: "Runner",
  organizer: "Organizer",
  admin: "Admin",
};

export function isRole(value: unknown): value is Role {
  return value === "runner" || value === "organizer" || value === "admin";
}

// admins only manage user accounts; races, payments and requests are organizer work
export function canManageEvents(role: Role) {
  return role === "organizer";
}

// where each role lands after login; the public site is off-limits while signed in
export function homeFor(role: Role) {
  return role === "runner" ? "/dashboard" : role === "organizer" ? "/organizer" : "/admin";
}

// only same-site paths, blocks //evil.com. empty fallback = "use the role home"
export function safeNext(next: unknown, fallback = "") {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
