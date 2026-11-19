import { z } from "zod";
import { EVENT_STATUSES, PAYMENT_METHODS, TSHIRT_SIZES } from "@/lib/constants";

// shared by the event form (client) and save action (server)

export const RACE_LENGTHS = ["3KM", "5KM", "10KM", "16KM", "21KM", "32KM", "42KM"];

const optionalInt = (label: string) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") return null;
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1 || n > 100000) {
        ctx.addIssue({ code: "custom", message: `${label} must be a whole number above 0.` });
        return z.NEVER;
      }
      return n;
    });

const optionalDate = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Enter a valid date.")
  .transform((v) => v || null);

export const distanceSchema = z.object({
  id: z.string().transform((v) => (v ? Number(v) : null)),
  label: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^\d{1,3}(\.\d)?\s?(KM|K|MI)$/, "Pick a distance, or enter a custom one in km.")
    .refine((v) => parseFloat(v) > 0, "Distance has to be more than 0 km."),
  price: z
    .string()
    .trim()
    .transform((v, ctx) => {
      const n = Number(v);
      if (v === "" || !Number.isFinite(n) || n < 0 || n > 1_000_000) {
        ctx.addIssue({ code: "custom", message: "Enter a fee of 0 or more." });
        return z.NEVER;
      }
      return Math.round(n * 100) / 100;
    }),
  slots: optionalInt("Slots"),
});

export const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Enter a race name.").max(150, "Race name is too long."),
    description: z.string().trim().min(20, "Describe the race in at least 20 characters.").max(5000),
    location: z.string().trim().min(2, "Enter where the race happens.").max(255),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick the race date."),
    startTime: z
      .string()
      .trim()
      .refine((v) => v === "" || /^\d{2}:\d{2}$/.test(v), "Enter a valid start time.")
      .transform((v) => (v ? `${v}:00` : null)),
    registrationCloses: optionalDate,
    capacity: optionalInt("Capacity"),
    paymentMethod: z.enum(PAYMENT_METHODS, "Choose GCash or bank transfer."),
    paymentBank: z.string().trim().max(100),
    paymentAccountName: z.string().trim().min(2, "Enter the account name runners will see.").max(150, "Account name is too long."),
    paymentAccountNumber: z
      .string()
      .trim()
      .regex(/^[\d\s-]{6,40}$/, "Enter the number using digits, spaces or dashes only."),
    paymentInstructions: z.string().trim().max(2000, "Keep the note under 2000 characters.").transform((v) => v || null),
    status: z.enum(EVENT_STATUSES),
    sizes: z.array(z.enum(TSHIRT_SIZES)).min(1, "Pick at least one shirt size."),
    distances: z.array(distanceSchema).min(1, "Add at least one distance."),
    bannerKey: z.string().transform((v) => v || null),
  })
  .superRefine((d, ctx) => {
    if (d.paymentMethod === "bank" && d.paymentBank.length < 2) {
      ctx.addIssue({ code: "custom", path: ["paymentBank"], message: "Enter the bank name, like BPI or BDO." });
    }
    if (d.registrationCloses && d.registrationCloses > d.eventDate) {
      ctx.addIssue({ code: "custom", path: ["registrationCloses"], message: "Registration has to close on or before race day." });
    }
    const labels = d.distances.map((x) => x.label.replace(/\s/g, ""));
    if (new Set(labels).size !== labels.length) {
      ctx.addIssue({ code: "custom", path: ["distances"], message: "Each distance can only be listed once." });
    }
  });

export type EventInput = z.output<typeof eventSchema>;

export type EventFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export function readEventForm(form: FormData) {
  const ids = form.getAll("distanceId").map(String);
  const labels = form.getAll("distanceLabel").map(String);
  const prices = form.getAll("distancePrice").map(String);
  const slots = form.getAll("distanceSlots").map(String);
  return {
    title: String(form.get("title") ?? ""),
    description: String(form.get("description") ?? ""),
    location: String(form.get("location") ?? ""),
    eventDate: String(form.get("eventDate") ?? ""),
    startTime: String(form.get("startTime") ?? ""),
    registrationCloses: String(form.get("registrationCloses") ?? ""),
    capacity: String(form.get("capacity") ?? ""),
    paymentMethod: String(form.get("paymentMethod") ?? ""),
    paymentBank: String(form.get("paymentBank") ?? ""),
    paymentAccountName: String(form.get("paymentAccountName") ?? ""),
    paymentAccountNumber: String(form.get("paymentAccountNumber") ?? ""),
    paymentInstructions: String(form.get("paymentInstructions") ?? ""),
    status: String(form.get("status") ?? ""),
    sizes: form.getAll("sizes").map(String),
    distances: labels.map((label, i) => ({ id: ids[i] ?? "", label, price: prices[i] ?? "", slots: slots[i] ?? "" })),
    bannerKey: String(form.get("bannerKey") ?? ""),
  };
}

export function flattenErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const [first, index, field] = issue.path;
    const key = first === "distances" && typeof index === "number" ? `distances.${index}.${String(field)}` : String(first);
    out[key] ??= issue.message;
  }
  return out;
}
