import { Suspense } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { availability, type PublicEvent } from "@/lib/events";
import { RaceBib, RaceBibSkeleton } from "./race-bib";

export function Hero({ eventsPromise }: { eventsPromise: Promise<PublicEvent[]> }) {
  return (
    <section className="relative overflow-hidden">
      <LaneLines />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 md:grid-cols-[1.1fr_1fr] md:pt-20 md:pb-28">
        <div className="max-w-xl">
          <h1 className="font-display text-[clamp(3rem,7vw,5.25rem)] leading-[0.95] font-extrabold tracking-tight text-balance">
            Find your next race and pick up your bib.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-muted-foreground">
            RaceLink lists fun runs and marathons in and around Metro Manila. Choose a distance, pay the fee, upload
            your receipt, and your bib number appears once the organizer approves it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#races" className={buttonVariants({ size: "lg", className: "h-11 px-5 text-base" })}>
              Browse races
            </a>
            <Link
              href="/login?tab=signup"
              scroll={false}
              className={buttonVariants({ variant: "outline", size: "lg", className: "h-11 px-5 text-base" })}
            >
              Create a runner account
            </Link>
          </div>
        </div>
        <Suspense fallback={<RaceBibSkeleton />}>
          <NextRaceBib eventsPromise={eventsPromise} />
        </Suspense>
      </div>
    </section>
  );
}

async function NextRaceBib({ eventsPromise }: { eventsPromise: Promise<PublicEvent[]> }) {
  const events = await eventsPromise;
  const next = events.find((e) => availability(e).open) ?? events[0] ?? null;
  return <RaceBib event={next} />;
}

// road lane markings sa background
function LaneLines() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-1/2 text-border md:block"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <line x1="58" y1="0" x2="58" y2="100" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 3" />
    </svg>
  );
}
