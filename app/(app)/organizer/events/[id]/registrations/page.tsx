import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Download, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilterTabs } from "@/components/filter-tabs";
import { BookingStatusMark, StatusBadge } from "@/components/status-badge";
import { formatDate, formatPeso } from "@/lib/events";
import { getRegistrations, type Registration } from "@/lib/queries/registrations";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { BibEditor, CheckInButton, ReviewButtons } from "@/components/organizer/review-actions";

export const metadata: Metadata = { title: "Registrations" };

const FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "To review" },
  { value: "approved", label: "Confirmed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

export default function RegistrationsPage({ params, searchParams }: PageProps<"/organizer/events/[id]/registrations">) {
  return (
    <div className="grid gap-6">
      <Link href="/organizer/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden /> Manage events
      </Link>
      <Suspense fallback={<div className="h-96 rounded-lg bg-card ring-1 ring-border" />}>
        <Registrations params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Registrations({
  params,
  searchParams,
}: Pick<PageProps<"/organizer/events/[id]/registrations">, "params" | "searchParams">) {
  const user = await requireUser("organizer");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const eventId = Number(id);
  if (!Number.isInteger(eventId)) notFound();

  const data = await getRegistrations(user, eventId);
  if (!data) notFound();
  const { event, list, counts } = data;

  const filter: Filter = FILTERS.some((f) => f.value === query.status) ? (query.status as Filter) : "all";
  const q = typeof query.q === "string" ? query.q.trim().toLowerCase() : "";
  const shown = list.filter(
    (r) =>
      (filter === "all" || r.status === filter) &&
      (!q ||
        r.runnerName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.bibNumber !== null && String(r.bibNumber).includes(q))),
  );
  const href = (status: Filter) => {
    const p = new URLSearchParams();
    if (status !== "all") p.set("status", status);
    if (q) p.set("q", q);
    const s = p.toString();
    return `/organizer/events/${event.id}/registrations${s ? `?${s}` : ""}`;
  };
  const countFor = (f: Filter) => (f === "all" ? list.length : counts[f]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold tracking-tight">{event.title}</h1>
            <StatusBadge status={event.status} />
          </div>
          <p className="mt-1 text-muted-foreground">
            Registrations for {formatDate(event.eventDate)}.{" "}
            <Link href={`/organizer/events/${event.id}`} className="font-medium text-primary hover:underline">
              Edit race details
            </Link>
          </p>
        </div>
        <a href={`/api/events/${event.id}/registrations`} className={buttonVariants({ variant: "outline", className: "h-9" })} download>
          <Download aria-hidden /> Export CSV
        </a>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="To review" value={counts.pending} tone={counts.pending > 0 ? "amber" : undefined} />
        <Stat label="Confirmed" value={counts.approved} suffix={event.capacity ? `/ ${event.capacity}` : undefined} />
        <Stat label="Checked in" value={counts.checkedIn} suffix={counts.approved ? `/ ${counts.approved}` : undefined} />
        <Stat label="Rejected" value={counts.rejected} />
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          label="Filter registrations"
          items={FILTERS.map((f) => ({ href: href(f.value), label: f.label, count: countFor(f.value), active: filter === f.value }))}
        />
        <form className="relative w-full sm:w-64" role="search">
          {filter !== "all" && <input type="hidden" name="status" value={filter} />}
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input name="q" defaultValue={q} placeholder="Name, email or bib" aria-label="Search runners" className="h-9 pl-8" />
        </form>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-lg bg-card p-10 text-center ring-1 ring-border">
          <p className="font-display text-2xl font-bold">{list.length === 0 ? "No registrations yet" : "No runners match"}</p>
          <p className="mt-2 text-muted-foreground">
            {list.length === 0
              ? "Runners show up here as soon as they register and upload a receipt."
              : "Try another filter or clear the search."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-card ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Runner</TableHead>
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
              {shown.map((r) => (
                <Row key={r.id} r={r} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

function Row({ r }: { r: Registration }) {
  return (
    <TableRow className="align-top">
      <TableCell className="pl-4">
        <p className="font-semibold">{r.runnerName}</p>
        <p className="text-sm text-muted-foreground">{r.email}</p>
        {r.phone && <p className="text-sm text-muted-foreground">{r.phone}</p>}
        {r.emergencyName && (
          <p className="text-xs text-muted-foreground">
            Emergency: {r.emergencyName}, {r.emergencyPhone}
          </p>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <p className="font-display text-lg leading-tight font-bold">{r.distanceLabel}</p>
        <p className="text-sm text-muted-foreground">Shirt {r.tshirtSize}</p>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {r.proof ? (
          <>
            <p className="tabular-nums">
              {formatPeso(r.proof.amount)}
              {r.proof.amount < r.price && <span className="text-destructive"> of {formatPeso(r.price)}</span>}
            </p>
            <p className="text-sm text-muted-foreground">{r.proof.referenceNo ? `Ref ${r.proof.referenceNo}` : "No reference"}</p>
            <a href={`/api/receipts/${r.proof.id}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">
              View receipt
            </a>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No receipt</p>
        )}
      </TableCell>
      <TableCell>
        <BookingStatusMark status={r.status} />
        {r.status === "rejected" && r.proof?.reviewNote && (
          <p className="mt-1 max-w-48 text-xs text-muted-foreground">{r.proof.reviewNote}</p>
        )}
        {r.attended && <p className="mt-1 text-xs font-semibold text-success">Checked in</p>}
      </TableCell>
      <TableCell className="text-right">
        {r.status === "approved" ? <BibEditor bookingId={r.id} bib={r.bibNumber} /> : <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell className="pr-4">
        {r.status === "pending" && <ReviewButtons bookingId={r.id} runnerName={r.runnerName} />}
        {r.status === "approved" && (
          <div className="flex justify-end">
            <CheckInButton bookingId={r.id} attended={r.attended} />
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

function Stat({ label, value, suffix, tone }: { label: string; value: number; suffix?: string; tone?: "amber" }) {
  return (
    <div className={cn("rounded-lg bg-card p-4 ring-1 ring-border", tone === "amber" && "shadow-[inset_3px_0_0_var(--primary)]")}>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-display text-3xl font-extrabold tabular-nums">
        {value}
        {suffix && <span className="ml-1 text-lg font-bold text-muted-foreground">{suffix}</span>}
      </dd>
    </div>
  );
}
