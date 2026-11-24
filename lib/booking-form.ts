import { z } from "zod";
import { GENDERS, TSHIRT_SIZES } from "@/lib/constants";

export const phone = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^[0-9+()\-\s]{7,20}$/, `Enter a valid ${label}, like 0917 123 4567.`);

export const runnerDetailsSchema = z.object({
  phone: phone("mobile number"),
  birthdate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter your birthdate.")
    .refine((d) => d < new Date().toISOString().slice(0, 10), "Birthdate has to be in the past."),
  gender: z.enum(GENDERS, { error: "Pick a gender." }),
  emergencyName: z.string().trim().min(2, "Enter an emergency contact name.").max(100),
  emergencyPhone: phone("emergency contact number"),
});

const reference = z.string().trim().max(100).transform((v) => v || null);

export const registerSchema = runnerDetailsSchema.extend({
  distanceId: z.coerce.number({ error: "Pick a distance." }).int().positive("Pick a distance."),
  tshirtSize: z.enum(TSHIRT_SIZES, { error: "Pick a shirt size." }),
  receiptKey: z.string().min(1, "Upload your payment receipt."),
  referenceNo: reference,
});

export const resubmitSchema = z.object({
  receiptKey: z.string().min(1, "Upload your new receipt."),
  referenceNo: reference,
});

export type FormState = { error?: string; fieldErrors?: Record<string, string> };

export function readForm(form: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((k) => [k, String(form.get(k) ?? "")]));
}

export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0])] ??= issue.message;
  return out;
}
