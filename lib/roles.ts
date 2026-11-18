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

export function canManageEvents(role: Role) {
  return role === "organizer" || role === "admin";
}

// only same-site paths, blocks //evil.com
export function safeNext(next: unknown, fallback = "/dashboard") {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
