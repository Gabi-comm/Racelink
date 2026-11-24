import { z } from "zod";

// one list drives the server check, the error message and the live checklist on the form
export const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "number", label: "At least 1 number", test: (p: string) => /\d/.test(p) },
  { id: "special", label: "At least 1 special character (like ! @ # $)", test: (p: string) => /[^A-Za-z0-9\s]/.test(p) },
] as const;

// bcrypt-style hashers only read the first 72 bytes
export const PASSWORD_MAX_BYTES = 72;

export function passwordProblem(p: string): string | null {
  const missing = PASSWORD_RULES.filter((r) => !r.test(p));
  if (missing.length > 0) {
    return `Your password needs ${missing.map((r) => r.label.replace(/^At least /, "at least ").replace(/ \(.*\)$/, "")).join(", ")}.`;
  }
  if (new TextEncoder().encode(p).length > PASSWORD_MAX_BYTES) return "Password is too long.";
  return null;
}

export const strongPassword = z.string().superRefine((p, ctx) => {
  const problem = passwordProblem(p);
  if (problem) ctx.addIssue({ code: "custom", message: problem });
});
