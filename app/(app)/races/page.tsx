import { Suspense } from "react";
import type { Metadata } from "next";
import { RaceListSkeleton, Races } from "@/components/races/race-list";
import { getPublicEvents } from "@/lib/queries/events";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Races" };

export default function RacesPage({ searchParams }: PageProps<"/races">) {
  return (
    <div className="grid gap-2">
      <h1 className="font-display text-3xl font-bold tracking-tight">Find a race</h1>
      <Suspense fallback={<RaceListSkeleton />}>
        <SignedInRaces searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

// login muna bago makita dito
async function SignedInRaces({ searchParams }: Pick<PageProps<"/races">, "searchParams">) {
  await requireUser();
  return <Races eventsPromise={getPublicEvents()} searchParams={searchParams} />;
}
