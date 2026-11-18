import { Suspense } from "react";
import type { PublicEvent } from "@/lib/events";
import { RaceBrowser } from "./race-browser";

type Props = {
  eventsPromise: Promise<PublicEvent[]>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function RacesSection({ eventsPromise, searchParams }: Props) {
  return (
    <section id="races" aria-labelledby="races-title" className="mx-auto w-full max-w-6xl px-4 py-20">
      <div className="max-w-2xl">
        <h2 id="races-title" className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
          Upcoming races
        </h2>
        <p className="mt-3 text-lg text-muted-foreground">
          Filter by month or distance, then open a race to see fees, shirt sizes and race-day details.
        </p>
      </div>
      <Suspense fallback={<RaceListSkeleton />}>
        <Races eventsPromise={eventsPromise} searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function Races({ eventsPromise, searchParams }: Props) {
  const [events, params] = await Promise.all([eventsPromise, searchParams]);
  const requested = Number(params.event);
  const initialEventId = events.some((e) => e.id === requested) ? requested : null;
  return <RaceBrowser events={events} initialEventId={initialEventId} />;
}

function RaceListSkeleton() {
  return (
    <div className="mt-10 grid gap-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-32 rounded-lg bg-card ring-1 ring-border" />
      ))}
    </div>
  );
}
