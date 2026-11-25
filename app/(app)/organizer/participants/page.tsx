import { ReceiptPreview } from "@/components/receipt-preview";
import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Search } from "lucide-react";
import { FilterTabs } from "@/components/filter-tabs";
import { BibEditor, RefundStatus, ReviewButtons, UndoConfirmButton } from "@/components/organizer/review-actions";
import { ExportMenu } from "@/components/organizer/export-menu";
import { UrlSelect } from "@/components/organizer/url-select";
import { inTab, isParticipantTab, PARTICIPANT_TABS, type ParticipantTab } from "@/lib/participant-filters";
import { EmptyState, PageHeader, Stat, TABLE_SHELL } from "@/components/stat";
import { BookingStatusMark } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatPeso } from "@/lib/events";
import { getParticipants, type Participant } from "@/lib/queries/registrations";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Manage Participants" };


export default function ParticipantsPage({ searchParams }: PageProps<"/organizer/participants">) {
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Race operations"
        title="Manage participants"
        description="Review payments, assign bibs, and keep runners moving."
      />
      <Participants searchParams={searchParams} />
    </div>
  );
}

async function Participants({ searchParams }: Pick<PageProps<"/organizer/participants">, "searchParams">) {
  const user = await requireUser("organizer");
  const [{ races, list }, query] = await Promise.all([getParticipants(user), searchParams]);

  const eventId = Number(query.event);
  const race = races.find((r) => r.id === eventId) ?? null;
  const status: ParticipantTab = isParticipantTab(query.status) ? query.status : "pending";
  const q = typeof query.q === "string" ? query.q.trim() : "";
  const needle = q.toLowerCase();

  const inRace = race ? list.filter((p) => p.eventId === race.id) : list;
  const shown = inRace.filter(
    (p) =>
      inTab(p, status) &&
      (!needle ||
        p.runnerName.toLowerCase().includes(needle) ||
        p.email.toLowerCase().includes(needle) ||
        (p.bibNumber !== null && String(p.bibNumber).includes(needle))),
  );

  const confirmed = inRace.filter((p) => p.status === "approved");
  const pending = inRace.filter((p) => p.status === "pending");
  const fees = confirmed.reduce((t, p) => t + p.price, 0);

  const tabCounts = Object.fromEntries(PARTICIPANT_TABS.map((t) => [t.value, inRace.filter((p) => inTab(p, t.value)).length])) as Record<ParticipantTab, number>;

  const href = (s: ParticipantTab) => {
    const p = new URLSearchParams();
    if (race) p.set("event", String(race.id));
    if (s !== "pending") p.set("status", s);
    if (q) p.set("q", q);
    const str = p.toString();
    return `/organizer/participants${str ? `?${str}` : ""}`;
  };

  return (
    <>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Payments to review" value={pending.length} attention={pending.length > 0} detail={formatPeso(pending.reduce((t, p) => t + p.price, 0)) + " waiting"} />
        <Stat label="Confirmed runners" value={confirmed.length} suffix={race?.capacity ? `/ ${race.capacity}` : undefined} />
        <Stat label="Fees confirmed" value={formatPeso(fees)} className="col-span-2 lg:col-span-1" />
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
        <Form action="/organizer/participants" className="grid gap-1" role="search">
          <label htmlFor="participant-search" className="text-xs font-medium text-muted-foreground">
            Search
          </label>
          {race && <input type="hidden" name="event" value={race.id} />}
          {status !== "pending" && <input type="hidden" name="status" value={status} />}
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id="participant-search" name="q" defaultValue={q} placeholder="Name, email or bib" className="h-9 pl-8" />
          </div>
        </Form>
        <ExportMenu key={status} tab={status} eventId={race?.id ?? null} counts={tabCounts} />
      </div>

      <FilterTabs
        label="Registration status"
        items={PARTICIPANT_TABS.map((s) => ({ href: href(s.value), label: s.label, count: tabCounts[s.value], active: status === s.value }))}
      />

      {shown.length === 0 ? (
        <EmptyState
          title={status === "pending" && !q ? "No payments to review" : "No runners match"}
          text={status === "pending" && !q ? "You're caught up. New receipts show up here as runners upload them." : "Try another race, tab, or search."}
        />
      ) : (
        <div className={TABLE_SHELL}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Runner</TableHead>
                {!race && <TableHead>Race</TableHead>}
                <TableHead>Entry</TableHead>
                <TableHead>Payment</TableHead>
                {/* on the Cancelled tab every row is cancelled, so Status tracks the refund instead */}
                {status !== "cancelled" && <TableHead>Status</TableHead>}
                <TableHead className="text-right">Bib</TableHead>
                {status === "cancelled" && <TableHead>Status</TableHead>}
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            {/* keyed by the filters so the rows fade in again on every change */}
            <TableBody>
              {shown.map((p) => (
                <Row key={p.id} p={p} showRace={!race} refundTab={status === "cancelled"} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

function Row({ p, showRace, refundTab }: { p: Participant; showRace: boolean; refundTab: boolean }) {
  return (
    <TableRow className="align-top">
      <TableCell className="pl-4">
        <p className="font-semibold">{p.runnerName}</p>
        <p className="mt-1 text-xs text-muted-foreground">{p.email}</p>
        {p.phone && <p className="text-xs text-muted-foreground">{p.phone}</p>}
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
        <p>
          {p.distanceLabel} · {p.tshirtSize}
        </p>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {p.proof ? (
          <>
            <p className="font-bold tabular-nums">
              {formatPeso(p.proof.amount)}
              {p.proof.amount < p.price && <span className="font-normal text-destructive"> of {formatPeso(p.price)}</span>}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{p.proof.referenceNo ? `Ref ${p.proof.referenceNo}` : "No reference"}</p>
            <ReceiptPreview receiptId={p.proof.id} className="text-xs font-medium text-link underline underline-offset-2" />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No receipt</p>
        )}
      </TableCell>
      {!refundTab && (
        <TableCell>
          <BookingStatusMark status={p.status} />
          {p.status === "rejected" && p.proof?.reviewNote && <p className="mt-1 max-w-48 text-xs text-muted-foreground">{p.proof.reviewNote}</p>}
        </TableCell>
      )}
      <TableCell className="text-right">
        {p.status === "approved" ? <BibEditor bookingId={p.id} bib={p.bibNumber} /> : <span className="text-muted-foreground">—</span>}
      </TableCell>
      {refundTab && (
        <TableCell>
          <RefundStatus refund={p.refund} runnerName={p.runnerName} receiptId={p.proof?.id} />
        </TableCell>
      )}
      <TableCell className="pr-4">
        {p.status === "pending" && <ReviewButtons bookingId={p.id} runnerName={p.runnerName} />}
        {p.status === "approved" && (
          <div className="flex justify-end">
            <UndoConfirmButton bookingId={p.id} runnerName={p.runnerName} bib={p.bibNumber} />
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
