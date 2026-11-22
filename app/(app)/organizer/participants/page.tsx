import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Download, Search } from "lucide-react";
import { FilterTabs } from "@/components/filter-tabs";
import { BibEditor, CheckInButton, ReviewButtons } from "@/components/organizer/review-actions";
import { UrlSelect } from "@/components/organizer/url-select";
import { EmptyState, PageHeader, Stat } from "@/components/stat";
import { BookingStatusMark } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatPeso } from "@/lib/events";
import { getParticipants, type Participant } from "@/lib/queries/registrations";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Manage Participants" };

const STATUSES = [
  { value: "pending", label: "Payments to review" },
  { value: "approved", label: "Confirmed" },
  { value: "nobib", label: "Needs a bib" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
] as const;
type StatusFilter = (typeof STATUSES)[number]["value"];

function matches(p: Participant, f: StatusFilter) {
  if (f === "all") return true;
  if (f === "nobib") return p.status === "approved" && p.bibNumber === null;
  return p.status === f;
}

export default function ParticipantsPage({ searchParams }: PageProps<"/organizer/participants">) {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Manage participants"
        description="Review payments, confirm runners, assign bibs and check runners in, across all your races."
      />
      <Suspense fallback={<div className="h-96 rounded-lg bg-card ring-1 ring-border" />}>
        <Participants searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Participants({ searchParams }: Pick<PageProps<"/organizer/participants">, "searchParams">) {
  const user = await requireUser("organizer");
  const [{ races, list }, query] = await Promise.all([getParticipants(user), searchParams]);

  const eventId = Number(query.event);
  const race = races.find((r) => r.id === eventId) ?? null;
  const status: StatusFilter = STATUSES.some((s) => s.value === query.status) ? (query.status as StatusFilter) : "pending";
  const q = typeof query.q === "string" ? query.q.trim() : "";
  const needle = q.toLowerCase();

  const inRace = race ? list.filter((p) => p.eventId === race.id) : list;
  const shown = inRace.filter(
    (p) =>
      matches(p, status) &&
      (!needle ||
        p.runnerName.toLowerCase().includes(needle) ||
        p.email.toLowerCase().includes(needle) ||
        (p.bibNumber !== null && String(p.bibNumber).includes(needle))),
  );

  const confirmed = inRace.filter((p) => p.status === "approved");
  const pending = inRace.filter((p) => p.status === "pending");
  const fees = confirmed.reduce((t, p) => t + p.price, 0);
  const withBib = confirmed.filter((p) => p.bibNumber !== null).length;
  const checkedIn = confirmed.filter((p) => p.attended).length;

  const href = (s: StatusFilter) => {
    const p = new URLSearchParams();
    if (race) p.set("event", String(race.id));
    if (s !== "pending") p.set("status", s);
    if (q) p.set("q", q);
    const str = p.toString();
    return `/organizer/participants${str ? `?${str}` : ""}`;
  };

  return (
    <>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Payments to review" value={pending.length} attention={pending.length > 0} detail={formatPeso(pending.reduce((t, p) => t + p.price, 0)) + " waiting"} />
        <Stat label="Confirmed runners" value={confirmed.length} suffix={race?.capacity ? `/ ${race.capacity}` : undefined} />
        <Stat label="Fees confirmed" value={formatPeso(fees)} />
        <Stat label="Bibs assigned" value={withBib} suffix={`/ ${confirmed.length}`} detail={withBib < confirmed.length ? `${confirmed.length - withBib} still need one` : "Every confirmed runner has a bib"} />
        <Stat label="Checked in" value={checkedIn} suffix={`/ ${confirmed.length}`} className="col-span-2 lg:col-span-1" />
      </dl>

      <div className="grid gap-3 rounded-lg bg-card p-4 ring-1 ring-border sm:grid-cols-[minmax(0,18rem)_1fr_auto] sm:items-end">
        <UrlSelect
          param="event"
          label="Race"
          value={race ? String(race.id) : ""}
          options={[
            { value: "", label: `All races (${list.length})` },
            ...races.map((r) => ({ value: String(r.id), label: `${r.title} · ${formatDate(r.eventDate, "short")}` })),
          ]}
        />
        <form className="grid gap-1" role="search">
          <label htmlFor="participant-search" className="text-xs font-medium text-muted-foreground">
            Search
          </label>
          {race && <input type="hidden" name="event" value={race.id} />}
          {status !== "pending" && <input type="hidden" name="status" value={status} />}
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id="participant-search" name="q" defaultValue={q} placeholder="Name, email or bib" className="h-9 pl-8" />
          </div>
        </form>
        {race ? (
          <a href={`/api/events/${race.id}/registrations`} className={buttonVariants({ variant: "outline", className: "h-9" })} download>
            <Download aria-hidden /> Export CSV
          </a>
        ) : (
          <p className="text-xs text-muted-foreground sm:max-w-40">Pick a race to export its list.</p>
        )}
      </div>

      <FilterTabs
        label="Registration status"
        items={STATUSES.map((s) => ({ href: href(s.value), label: s.label, count: inRace.filter((p) => matches(p, s.value)).length, active: status === s.value }))}
      />

      {shown.length === 0 ? (
        <EmptyState
          title={status === "pending" && !q ? "No payments to review" : "No runners match"}
          text={status === "pending" && !q ? "You're caught up. New receipts show up here as runners upload them." : "Try another race, tab, or search."}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg bg-card ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Runner</TableHead>
                {!race && <TableHead>Race</TableHead>}
                <TableHead>Entry</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Bib</TableHead>
                <TableHead className="pr-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((p) => (
                <Row key={p.id} p={p} showRace={!race} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Bibs are assigned in order when you approve a payment. Click a bib number to change it.
      </p>
    </>
  );
}

function Row({ p, showRace }: { p: Participant; showRace: boolean }) {
  return (
    <TableRow className="align-top">
      <TableCell className="pl-4">
        <p className="font-semibold">{p.runnerName}</p>
        <p className="text-sm text-muted-foreground">{p.email}</p>
        {p.phone && <p className="text-sm text-muted-foreground">{p.phone}</p>}
      </TableCell>
      {showRace && (
        <TableCell className="max-w-52">
          <Link href={`/organizer/participants?event=${p.eventId}`} className="font-medium hover:underline">
            {p.eventTitle}
          </Link>
          <p className="text-sm text-muted-foreground">{formatDate(p.eventDate, "short")}</p>
        </TableCell>
      )}
      <TableCell className="whitespace-nowrap">
        <p className="font-semibold">{p.distanceLabel}</p>
        <p className="text-sm text-muted-foreground">Shirt {p.tshirtSize}</p>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {p.proof ? (
          <>
            <p className="tabular-nums">
              {formatPeso(p.proof.amount)}
              {p.proof.amount < p.price && <span className="text-destructive"> of {formatPeso(p.price)}</span>}
            </p>
            <p className="text-sm text-muted-foreground">{p.proof.referenceNo ? `Ref ${p.proof.referenceNo}` : "No reference"}</p>
            <a href={`/api/receipts/${p.proof.id}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">
              View receipt
            </a>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No receipt</p>
        )}
      </TableCell>
      <TableCell>
        <BookingStatusMark status={p.status} />
        {p.status === "rejected" && p.proof?.reviewNote && <p className="mt-1 max-w-48 text-xs text-muted-foreground">{p.proof.reviewNote}</p>}
        {p.attended && <p className="mt-1 text-xs font-semibold text-success">Checked in</p>}
      </TableCell>
      <TableCell className="text-right">
        {p.status === "approved" ? <BibEditor bookingId={p.id} bib={p.bibNumber} /> : <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell className="pr-4">
        {p.status === "pending" && <ReviewButtons bookingId={p.id} runnerName={p.runnerName} />}
        {p.status === "approved" && (
          <div className="flex justify-end">
            <CheckInButton bookingId={p.id} attended={p.attended} />
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
