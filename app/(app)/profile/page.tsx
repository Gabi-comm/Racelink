import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { runnerProfiles } from "@/lib/db/schema";
import { Check, Circle } from "lucide-react";
import { ROLE_LABEL } from "@/lib/roles";
import { requireUser } from "@/lib/session";
import { DetailsForm, NameForm, PasswordForm } from "./profile-forms";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-muted-foreground">Your account, the details organizers see when you register, and your password.</p>
      </div>
      <Suspense fallback={<div className="h-96 rounded-lg bg-card ring-1 ring-border" />}>
        <Sections />
      </Suspense>
    </div>
  );
}

async function Sections() {
  const user = await requireUser();
  await connection();
  const [profile] = await db.select().from(runnerProfiles).where(eq(runnerProfiles.userId, user.id)).limit(1);

  const fields = [
    ["Mobile number", profile?.phone],
    ["Address", profile?.address],
    ["Gender", profile?.gender],
    ["Birthdate", profile?.birthdate],
    ["Emergency contact", profile?.emergencyName],
    ["Emergency phone", profile?.emergencyPhone],
  ] as const;
  const filled = fields.filter(([, v]) => !!v).length;
  const pct = Math.round((filled / fields.length) * 100);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[18rem_1fr]">
      <aside className="grid gap-4 rounded-lg bg-card p-5 ring-1 ring-border lg:sticky lg:top-24">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-deep font-display text-lg font-bold text-white" aria-hidden>
            {initials(user.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="grid gap-2 border-t pt-4">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">Runner details</span>
            <span className="font-semibold tabular-nums">{pct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Profile completion">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <ul className="mt-1 grid gap-1 text-sm">
            {fields.map(([label, v]) => (
              <li key={label} className="flex items-center gap-2">
                {v ? <Check className="size-3.5 text-success" aria-hidden /> : <Circle className="size-3.5 text-muted-foreground" aria-hidden />}
                <span className={v ? "" : "text-muted-foreground"}>{label}</span>
                <span className="sr-only">{v ? "added" : "missing"}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="border-t pt-4 text-xs text-muted-foreground">Account type: {ROLE_LABEL[user.role]}</p>
      </aside>
      <div className="grid gap-6">
        <Section title="Account" description="Your name shows on registrations and receipts.">
          <NameForm name={user.name} email={user.email} />
        </Section>
        <Section
          title="Runner details"
          description="Filled in for you when you register for a race. Organizers see these on your registration."
        >
          <DetailsForm key={profile?.updatedAt.getTime() ?? 0} profile={profile ?? null} />
        </Section>
        <Section title="Password" description="Changing it signs you out on your other devices.">
          <PasswordForm />
        </Section>
      </div>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="grid gap-5 rounded-lg bg-card p-5 ring-1 ring-border md:p-6">
      <div>
        <h2 className="font-display text-lg font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}
