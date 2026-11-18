"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock, FileText, MapPin, Search, Shirt, Users } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type Props = { events: PublicEvent[]; initialEventId: number | null };

export function RaceBrowser({ events, initialEventId }: Props) {
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("");
  const [distance, setDistance] = useState("");
  const [openId, setOpenId] = useState<number | null>(initialEventId);

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

  function openRace(id: number | null) {
    setOpenId(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("event", String(id));
    else url.searchParams.delete("event");
    window.history.replaceState(null, "", url);
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
        {selected && <RaceDetails event={selected} />}
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
        <span className="font-display text-4xl leading-none font-extrabold tabular-nums">{day}</span>
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
    return <p className="text-sm font-medium text-amber-700">Only {avail.slotsLeft} slots left</p>;
  }
  return <p className="text-sm text-muted-foreground">Registration open</p>;
}

function RaceDetails({ event }: { event: PublicEvent }) {
  const avail = availability(event);
  const start = formatTime(event.startTime);

  return (
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
      {event.hasBanner && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/events/${event.id}/banner`}
          alt=""
          className="-mx-4 -mt-4 aspect-[3/1] w-[calc(100%+2rem)] max-w-none rounded-t-xl object-cover"
        />
      )}
      <DialogHeader>
        <DialogTitle className="font-display text-3xl leading-tight font-extrabold">{event.title}</DialogTitle>
        <DialogDescription className="text-base">{event.location}</DialogDescription>
      </DialogHeader>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Detail icon={CalendarDays} label="Race day" value={formatDate(event.eventDate)} />
        {start && <Detail icon={Clock} label="Gun start" value={start} />}
        {event.registrationCloses && (
          <Detail icon={CalendarDays} label="Registration closes" value={formatDate(event.registrationCloses)} />
        )}
        {event.capacity !== null && (
          <Detail icon={Users} label="Runners" value={`${event.registered} of ${event.capacity} registered`} />
        )}
      </dl>

      <p className="leading-relaxed whitespace-pre-line">{event.description}</p>

      <div>
        <h3 className="font-display text-xl font-bold">Distances and fees</h3>
        <table className="mt-2 w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr className="border-b">
              <th scope="col" className="py-2 font-medium">
                Distance
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                Fee
              </th>
            </tr>
          </thead>
          <tbody>
            {event.distances.map((d) => (
              <tr key={d.id} className="border-b last:border-0">
                <th scope="row" className="py-2 text-left font-display text-lg font-bold">
                  {d.label}
                </th>
                <td className="py-2 text-right font-semibold tabular-nums">{formatPeso(d.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {event.sizes.length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 font-display text-xl font-bold">
            <Shirt className="size-5" aria-hidden /> Shirt sizes
          </h3>
          <p className="mt-1 text-muted-foreground">{event.sizes.join(", ")}</p>
        </div>
      )}

      {event.documents.length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 font-display text-xl font-bold">
            <FileText className="size-5" aria-hidden /> Race files
          </h3>
          <ul className="mt-1 grid gap-1">
            {event.documents.map((d) => (
              <li key={d.id}>
                <a
                  href={`/api/events/${event.id}/documents/${d.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {d.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <DialogFooter className="items-center sm:justify-between">
        {avail.open ? (
          <>
            <p className="text-sm text-muted-foreground">You&apos;ll log in or sign up first if you haven&apos;t yet.</p>
            <Link href={`/register/${event.id}`} className={buttonVariants({ size: "lg", className: "h-10 px-5" })}>
              Register for this race
            </Link>
          </>
        ) : (
          <p className="font-medium text-destructive">{avail.reason}</p>
        )}
      </DialogFooter>
    </DialogContent>
  );
}

function Detail({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <div className="flex gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div>
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="font-semibold">{value}</dd>
      </div>
    </div>
  );
}
