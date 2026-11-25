import type { PublicEvent } from "@/lib/events";
import { getCurrentUser } from "@/lib/session";
import { RaceBrowser } from "./race-browser";

export type RacesProps = {
  eventsPromise: Promise<PublicEvent[]>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function Races({ eventsPromise, searchParams }: RacesProps) {
  const [events, params, user] = await Promise.all([eventsPromise, searchParams, getCurrentUser()]);
  const requested = Number(params.event);
  const initialEventId = events.some((e) => e.id === requested) ? requested : null;
  return <RaceBrowser events={events} initialEventId={initialEventId} signedIn={!!user} />;
}

export function RaceListSkeleton() {
  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-96 rounded-2xl bg-card ring-1 ring-border" />
      ))}
    </div>
  );
}
