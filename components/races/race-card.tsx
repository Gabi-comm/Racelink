import type { ReactNode } from "react";
import { MapPin } from "lucide-react";
import { dateParts, formatPeso } from "@/lib/events";
import { cn } from "@/lib/utils";

export const PILL = "inline-flex items-center rounded-full px-3 py-1 text-[0.7rem] font-bold tracking-[0.12em] uppercase";

// fallback kapag walang banner, umiikot per card
const BANDS = ["#7b8ce0", "#d99a4e", "#3aa99b"];
const STRIPES = "repeating-linear-gradient(135deg, rgb(255 255 255 / 0.13) 0 12px, transparent 12px 24px)";

export type RaceCardData = {
  id: number;
  title: string;
  location: string;
  eventDate: string;
  hasBanner: boolean;
  distances: string[];
  priceFrom: number | null;
};

export function RaceCard({ race, n, badge, actions }: { race: RaceCardData; n: number; badge?: string; actions: ReactNode }) {
  const d = dateParts(race.eventDate);
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border">
      <div
        className="relative h-44 overflow-hidden p-4"
        style={race.hasBanner ? undefined : { backgroundColor: BANDS[n % BANDS.length], backgroundImage: STRIPES }}
      >
        {race.hasBanner && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/events/${race.id}/banner`} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/20" />
          </>
        )}
        {badge && <span className={cn(PILL, "relative bg-marking text-marking-foreground")}>{badge}</span>}
        <ul className="absolute bottom-4 left-4 flex flex-wrap gap-1.5" aria-label="Distances">
          {race.distances.map((x) => (
            <li key={x} className="rounded-full border border-white/50 bg-white/15 px-2.5 py-1 text-[0.7rem] font-bold text-white uppercase backdrop-blur-sm">
              {x}
            </li>
          ))}
        </ul>
        <span
          className="pointer-events-none absolute -right-1 -bottom-3 font-[family-name:var(--font-oswald)] text-[7.5rem] leading-none font-bold text-white/25"
          aria-hidden
        >
          {String(n + 1).padStart(2, "0")}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="flex gap-4">
          <span className="grid w-12 shrink-0 content-center border-r pr-4 leading-none">
            <span className="font-[family-name:var(--font-oswald)] text-3xl font-bold tabular-nums">{d.day.padStart(2, "0")}</span>
            <span className="mt-1.5 text-[0.65rem] font-bold tracking-[0.12em] text-link uppercase">{d.month}</span>
          </span>
          <div className="min-w-0 self-center">
            <h3 className="font-[family-name:var(--font-oswald)] text-2xl leading-tight font-bold uppercase">{race.title}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{race.location}</span>
            </p>
          </div>
        </div>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-dashed border-brand-light/60 pt-4">
          <div>
            <p className="text-[0.65rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">Starts at</p>
            <p className="font-[family-name:var(--font-oswald)] text-2xl leading-none font-bold">
              {race.priceFrom ? formatPeso(race.priceFrom) : "Free"}
            </p>
          </div>
          <div className="flex items-center gap-4">{actions}</div>
        </div>
      </div>
    </article>
  );
}
