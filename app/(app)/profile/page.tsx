import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { runnerProfiles } from "@/lib/db/schema";
import { ROLE_LABEL } from "@/lib/roles";
import { requireUser } from "@/lib/session";
import { DetailsForm, NameForm, PasswordForm } from "./profile-forms";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Profile</h1>
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

  return (
    <>
      <Section title="Account" description={`Signed in as ${ROLE_LABEL[user.role].toLowerCase()}.`}>
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
    </>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="grid gap-5 rounded-lg bg-card p-5 ring-1 ring-border md:p-6">
      <div>
        <h2 className="font-display text-2xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}
