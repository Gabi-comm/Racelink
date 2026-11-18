import { cn } from "@/lib/utils";
import { formatDate, type PublicEvent } from "@/lib/events";

type Props = { event: PublicEvent | null; className?: string };

// hero bib, printed with the next open race
export function RaceBib({ event, className }: Props) {
  const bib = event ? String(1001 + event.registered).padStart(4, "0") : "2027";
  return (
    <figure
      className={cn(
        "relative mx-auto w-full max-w-[26rem] -rotate-2 rounded-md bg-card text-card-foreground shadow-[0_24px_48px_-24px_rgba(28,36,48,0.45)] ring-1 ring-border motion-safe:animate-[bib-in_700ms_cubic-bezier(.2,.8,.2,1)_both]",
        className,
      )}
      aria-label={event ? `Race bib for ${event.title}` : "RaceLink race bib"}
    >
      <PinHoles />
      <div className="rounded-t-md bg-primary px-6 pt-5 pb-4 text-primary-foreground">
        <p className="font-display text-sm font-semibold tracking-wide text-primary-foreground/80">Next race</p>
        <p className="font-display text-2xl font-bold leading-tight">{event?.title ?? "Your next race"}</p>
      </div>

      <div className="px-6 pt-4 pb-5">
        <p
          className="font-display text-[clamp(5.5rem,16vw,8.5rem)] leading-[0.85] font-extrabold tabular-nums tracking-tighter"
          aria-hidden
        >
          {bib}
        </p>
        <div className="mt-3 h-1.5 w-16 rounded-full bg-marking" aria-hidden />
        {event ? (
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Race day</dt>
              <dd className="font-semibold">{formatDate(event.eventDate, "short")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Where</dt>
              <dd className="font-semibold">{event.location}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">New races are posted here as organizers open registration.</p>
        )}
      </div>

      {event && event.distances.length > 0 && (
        <div className="flex border-t-2 border-dashed border-border" aria-label="Distances">
          {event.distances.map((d) => (
            <span
              key={d.id}
              className="flex-1 border-r-2 border-dashed border-border py-2.5 text-center font-display text-lg font-bold last:border-r-0"
            >
              {d.label}
            </span>
          ))}
        </div>
      )}
    </figure>
  );
}

function PinHoles() {
  const hole = "absolute size-3 rounded-full bg-background ring-1 ring-border";
  return (
    <span aria-hidden>
      <span className={cn(hole, "top-2.5 left-2.5 z-10")} />
      <span className={cn(hole, "top-2.5 right-2.5 z-10")} />
      <span className={cn(hole, "bottom-2.5 left-2.5 z-10")} />
      <span className={cn(hole, "right-2.5 bottom-2.5 z-10")} />
    </span>
  );
}

export function RaceBibSkeleton() {
  return <div className="mx-auto aspect-[4/5] w-full max-w-[26rem] -rotate-2 rounded-md bg-card ring-1 ring-border" />;
}
