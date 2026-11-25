import type { Metadata } from "next";
import { Races } from "@/components/races/race-list";
import { getPublicEvents } from "@/lib/queries/events";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Races" };

export default function RacesPage({ searchParams }: PageProps<"/races">) {
  return (
    <div className="grid gap-2">
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-link uppercase">Explore events</p>
        <h1 className="mt-2 font-[family-name:var(--font-oswald)] text-5xl font-bold uppercase md:text-6xl">Find a race</h1>
        <p className="mt-2 text-muted-foreground">Metro Manila&apos;s next start line is waiting.</p>
      </div>
      <SignedInRaces searchParams={searchParams} />
    </div>
  );
}

// login muna bago makita dito
async function SignedInRaces({ searchParams }: Pick<PageProps<"/races">, "searchParams">) {
  await requireUser();
  return <Races eventsPromise={getPublicEvents()} searchParams={searchParams} />;
}
