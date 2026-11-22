"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, CalendarClock, CalendarDays, Clock, FileText, MapPin, Search, Shirt, Users, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  availability,
  dateParts,
  distanceKm,
  formatDate,
  formatPeso,
  formatTime,
  monthKey,
  monthLabel,
  priceFrom,
  type PublicEvent,
} from "@/lib/events";

type Props = { events: PublicEvent[]; initialEventId: number | null; signedIn: boolean };

export function RaceBrowser({ events, initialEventId, signedIn }: Props) {
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("");
  const [distance, setDistance] = useState("");
  const [openId, setOpenId] = useState<number | null>(initialEventId);
  const router = useRouter();
  const pathname = usePathname();

  const months = useMemo(() => [...new Set(events.map((e) => monthKey(e.eventDate)))], [events]);
  const distances = useMemo(
    () =>
      [...new Set(events.flatMap((e) => e.distances.map((d) => d.label)))].sort(
        (a, b) => distanceKm(a) - distanceKm(b),
      ),
    [events],
  );

  const q = query.trim().toLowerCase();
  const shown = events.filter(
    (e) =>
      (!q || e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q)) &&
      (!month || monthKey(e.eventDate) === month) &&
      (!distance || e.distances.some((d) => d.label === distance)),
  );
  const filtering = Boolean(q || month || distance);
  const selected = events.find((e) => e.id === openId) ?? null;

  // replaceState dito nag-cause ng full reload sa login popup, kaya router lang
  function openRace(id: number | null) {
    setOpenId(id);
    if (id === null && new URLSearchParams(window.location.search).has("event")) {
      router.replace(pathname, { scroll: false });
    }
  }

  function clearFilters() {
    setQuery("");
    setMonth("");
    setDistance("");
  }

  if (events.length === 0) {
    return (
      <div className="mt-10 rounded-lg bg-card p-10 text-center ring-1 ring-border">
        <p className="font-display text-2xl font-bold">No races open yet</p>
        <p className="mt-2 text-muted-foreground">Organizers post new races here. Check back soon.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-10 flex flex-col gap-4 rounded-lg bg-card p-4 ring-1 ring-border md:flex-row md:items-end">
        <label className="grid flex-1 gap-1.5 text-sm font-medium">
          Search
          <span className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Race name or city"
              className="h-10 pl-9"
            />
          </span>
        </label>
        <label className="grid gap-1.5 text-sm font-medium md:w-52">
          Month
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Any month</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="grid gap-1.5">
          <legend className="mb-1.5 text-sm font-medium">Distance</legend>
          <div className="flex flex-wrap gap-1.5">
            {distances.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={distance === d}
                onClick={() => setDistance(distance === d ? "" : d)}
                className={cn(
                  "h-10 rounded-lg border px-3 font-display text-base font-bold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  distance === d
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-muted",
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        {filtering ? `${shown.length} of ${events.length} races match` : `${events.length} races`}
        {filtering && (
          <button type="button" onClick={clearFilters} className="ml-3 font-medium text-primary underline-offset-4 hover:underline">
            Clear filters
          </button>
        )}
      </p>

      {shown.length === 0 ? (
        <div className="mt-4 rounded-lg bg-card p-10 text-center ring-1 ring-border">
          <p className="font-display text-2xl font-bold">No races match those filters</p>
          <p className="mt-2 text-muted-foreground">Try another month or distance.</p>
          <Button variant="outline" size="lg" className="mt-5" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <ol className="mt-4 divide-y overflow-hidden rounded-lg bg-card ring-1 ring-border">
          {shown.map((e) => (
            <RaceRow key={e.id} event={e} onOpen={() => openRace(e.id)} />
          ))}
        </ol>
      )}

      <Dialog open={selected !== null} onOpenChange={(open) => !open && openRace(null)}>
        {selected && <RaceDetails event={selected} signedIn={signedIn} />}
      </Dialog>
    </>
  );
}

function RaceRow({ event, onOpen }: { event: PublicEvent; onOpen: () => void }) {
  const { day, month, weekday } = dateParts(event.eventDate);
  const avail = availability(event);
  const from = priceFrom(event);

  return (
    <li className="grid grid-cols-[4.5rem_1fr] gap-x-5 gap-y-4 p-5 md:grid-cols-[5.5rem_1fr_auto] md:items-center md:gap-x-8 md:p-6">
      <div className="row-span-2 flex flex-col items-center rounded-md border py-2 text-center md:row-span-1">
        <span className="text-sm font-semibold text-primary">{month}</span>
        <span className="font-display text-3xl leading-none font-extrabold tabular-nums">{day}</span>
        <span className="text-xs text-muted-foreground">{weekday}</span>
      </div>

      <div className="min-w-0">
        <h3 className="font-display text-2xl leading-tight font-bold">{event.title}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="size-4 shrink-0" aria-hidden />
          {event.location}
        </p>
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Distances">
          {event.distances.map((d) => (
            <li key={d.id} className="rounded-md bg-muted px-2 py-0.5 font-display text-sm font-bold">
              {d.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="col-start-2 flex flex-wrap items-center justify-between gap-3 md:col-start-3 md:flex-col md:items-end md:gap-2">
        <div className="md:text-right">
          {from !== null && (
            <p className="font-semibold">
              <span className="font-normal text-muted-foreground">From </span>
              {formatPeso(from)}
            </p>
          )}
          <AvailabilityText event={event} />
        </div>
        <Button size="lg" variant={avail.open ? "default" : "outline"} onClick={onOpen}>
          View details
        </Button>
      </div>
    </li>
  );
}

function AvailabilityText({ event }: { event: PublicEvent }) {
  const avail = availability(event);
  if (!avail.open) return <p className="text-sm font-medium text-destructive">{avail.reason}</p>;
  if (avail.slotsLeft !== null && event.capacity && avail.slotsLeft <= Math.max(10, event.capacity * 0.1)) {
    return <p className="text-sm font-medium text-warning">Only {avail.slotsLeft} slots left</p>;
  }
  return <p className="text-sm text-muted-foreground">Registration open</p>;
}

function RaceDetails({ event, signedIn }: { event: PublicEvent; signedIn: boolean }) {
  const avail = availability(event);
  const start = formatTime(event.startTime);
  const { day, month, weekday } = dateParts(event.eventDate);
  const from = priceFrom(event);
  const fill = event.capacity ? Math.min(100, Math.round((event.registered / event.capacity) * 100)) : null;

  return (
    <DialogContent showCloseButton={false} className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
      {/* header: banner (or brand band) with the date tile and title */}
      <div className="relative shrink-0 overflow-hidden bg-brand-deep text-white">
        {event.hasBanner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/events/${event.id}/banner`} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_140%_at_100%_0%,rgb(212_0_0/0.55),transparent_60%)]" />
        )}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />

        <DialogClose
          render={
            <button
              type="button"
              className="absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition-colors outline-none hover:bg-black/60 focus-visible:ring-3 focus-visible:ring-white/50"
            />
          }
        >
          <X className="size-4" aria-hidden />
          <span className="sr-only">Close</span>
        </DialogClose>

        <div className="relative flex items-end gap-4 px-5 pt-14 pb-5 sm:px-6">
          <div className="flex w-16 shrink-0 flex-col items-center rounded-lg bg-white py-2 text-center text-[#221a1a] shadow-lg">
            <span className="text-xs font-bold text-[#d40000] uppercase">{month}</span>
            <span className="font-display text-3xl leading-none font-extrabold tabular-nums">{day}</span>
            <span className="text-[11px] text-[#6b5b58]">{weekday}</span>
          </div>
          <div className="min-w-0">
            <DialogTitle className="font-display text-2xl leading-tight font-extrabold text-white sm:text-3xl">{event.title}</DialogTitle>
            <DialogDescription className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
              <MapPin className="size-4 shrink-0" aria-hidden />
              {event.location}
            </DialogDescription>
          </div>
        </div>
      </div>

      {/* body scrolls, header and footer stay put */}
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-5 sm:px-6 [&>*]:shrink-0">
        <dl className="grid gap-px overflow-hidden rounded-lg bg-border ring-1 ring-border sm:grid-cols-2">
          <Detail icon={CalendarDays} label="Race day" value={formatDate(event.eventDate)} />
          <Detail icon={Clock} label="Gun start" value={start ?? "To be announced"} />
          <Detail
            icon={CalendarClock}
            label="Registration closes"
            value={event.registrationCloses ? formatDate(event.registrationCloses) : "When slots run out"}
          />
          <Detail
            icon={Users}
            label="Runners"
            value={event.capacity !== null ? `${event.registered} of ${event.capacity}` : `${event.registered} registered`}
          >
            {fill !== null && (
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${fill}%` }} />
              </div>
            )}
          </Detail>
        </dl>

        {event.description && <p className="leading-relaxed whitespace-pre-line text-foreground/90">{event.description}</p>}

        <section>
          <h3 className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">Distances and fees</h3>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {event.distances.map((d) => (
              <li key={d.id} className="rounded-lg border bg-background px-4 py-3">
                <p className="font-display text-xl leading-none font-extrabold">{d.label}</p>
                <p className="mt-1.5 text-sm font-semibold text-primary tabular-nums">{formatPeso(d.price)}</p>
              </li>
            ))}
          </ul>
        </section>

        {event.sizes.length > 0 && (
          <section>
            <h3 className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              <Shirt className="size-4" aria-hidden /> Shirt sizes
            </h3>
            <p className="mt-2 font-semibold">{event.sizes.join(" · ")}</p>
          </section>
        )}

        {event.documents.length > 0 && (
          <section>
            <h3 className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              <FileText className="size-4" aria-hidden /> Race files
            </h3>
            <ul className="mt-2 grid gap-1.5">
              {event.documents.map((d) => (
                <li key={d.id}>
                  <a
                    href={`/api/events/${event.id}/documents/${d.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {d.title} <ArrowUpRight className="size-3.5" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t bg-muted/50 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          {from !== null && (
            <p className="font-display text-lg font-bold">
              <span className="text-sm font-normal text-muted-foreground">From </span>
              {formatPeso(from)}
            </p>
          )}
          {avail.open ? <AvailabilityText event={event} /> : <p className="text-sm font-medium text-destructive">{avail.reason}</p>}
        </div>
        {avail.open && (
          <Link
            href={signedIn ? `/register/${event.id}` : `/login?next=${encodeURIComponent(`/register/${event.id}`)}`}
            scroll={signedIn}
            className={buttonVariants({ size: "lg", className: "h-11 gap-1.5 px-5" })}
          >
            Register for this race <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
    </DialogContent>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex gap-2.5 bg-card p-3.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 text-sm font-semibold">{value}</dd>
        {children}
      </div>
    </div>
  );
}
