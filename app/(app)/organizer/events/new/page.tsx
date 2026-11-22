import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { EventForm } from "../../event-form";

export const metadata: Metadata = { title: "New race" };

export default function NewEventPage() {
  return (
    <div className="grid gap-6">
      <div>
        <Link href="/organizer/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" aria-hidden /> Manage events
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">New race</h1>
        <p className="mt-1 text-muted-foreground">Save it as a draft first if you&apos;re not ready to take registrations.</p>
      </div>
      <Suspense fallback={<div className="h-96 rounded-lg bg-card ring-1 ring-border" />}>
        <Gate />
      </Suspense>
    </div>
  );
}

async function Gate() {
  await requireUser("organizer");
  return <EventForm />;
}
