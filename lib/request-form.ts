import { z } from "zod";

// shared by the public request form (client) and submitRaceRequest (server)

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((v) => v || null);

export const raceRequestSchema = z.object({
  organization: z.string().trim().min(2, "Enter the name of your organization.").max(150, "Organization name is too long."),
  contactName: z.string().trim().min(2, "Enter the name of the person we should talk to.").max(100, "Name is too long."),
  email: z.email("Enter a valid email address.").trim().toLowerCase().max(255),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[\d\s+()-]{7,30}$/.test(v), "Enter a valid phone number.")
    .transform((v) => v || null),
  raceTitle: z.string().trim().min(3, "Give the race a working name.").max(150, "Race name is too long."),
  proposedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick the date you have in mind."),
  location: z.string().trim().min(2, "Enter where the race would happen.").max(255),
  expectedRunners: z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") return null;
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1 || n > 100000) {
        ctx.addIssue({ code: "custom", message: "Enter a whole number above 0." });
        return z.NEVER;
      }
      return n;
    }),
  distances: optionalText(150, "Keep the distances short, like 3K, 5K, 10K."),
  message: optionalText(2000, "Keep the message under 2000 characters."),
});

export type RaceRequestInput = z.output<typeof raceRequestSchema>;
export type RaceRequestField = keyof z.input<typeof raceRequestSchema>;

export type RaceRequestState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<RaceRequestField, string>>;
  values?: Partial<Record<RaceRequestField, string>>;
};

export const REQUEST_FIELDS: RaceRequestField[] = [
  "organization",
  "contactName",
  "email",
  "phone",
  "raceTitle",
  "proposedDate",
  "location",
  "expectedRunners",
  "distances",
  "message",
];
