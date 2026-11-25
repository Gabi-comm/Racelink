import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FilterTabs } from "@/components/filter-tabs";
import { EmptyState, PageHeader } from "@/components/stat";
import { REQUEST_STATUSES, type RequestStatus } from "@/lib/constants";
import { formatDate } from "@/lib/events";
import { getRequests, type RaceRequestRow } from "@/lib/queries/requests";
import { requireUser } from "@/lib/session";
import { RequestActions } from "./request-actions";

export const metadata: Metadata = { title: "Request Forms" };

const LABEL: Record<RequestStatus, string> = { pending: "Pending", approved: "Approved", rejected: "Rejected" };

const submitted = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });

export default function RequestsPage({ searchParams }: PageProps<"/organizer/requests">) {
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Incoming partners"
        title="Request forms"
        description="Review race proposals from organizations. Approving one creates a draft race for you to finish."
      />
      <Suspense fallback={<div className="h-96 rounded-lg bg-card ring-1 ring-border" />}>
        <Requests searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Requests({ searchParams }: Pick<PageProps<"/organizer/requests">, "searchParams">) {
  await requireUser("organizer");
  const query = await searchParams;
  const status: RequestStatus = REQUEST_STATUSES.includes(query.status as RequestStatus) ? (query.status as RequestStatus) : "pending";
  const { list, counts } = await getRequests(status);

  return (
    <>
      <FilterTabs
        label="Request status"
        items={REQUEST_STATUSES.map((s) => ({
          href: s === "pending" ? "/organizer/requests" : `/organizer/requests?status=${s}`,
          label: LABEL[s],
          count: counts[s],
          active: status === s,
        }))}
      />
      {list.length === 0 ? (
        <EmptyState
          title={status === "pending" ? "No requests waiting" : `No ${LABEL[status].toLowerCase()} requests`}
          text={
            status === "pending"
              ? "Organizations send requests from the Request page on the public site. New ones show up here."
              : "Requests show up here once an organizer reviews them."
          }
        />
      ) : (
        <ul key={status} className="stagger grid gap-5 lg:grid-cols-2">
          {list.map((r, i) => (
            <RequestCard key={r.id} r={r} n={i + 1} />
          ))}
        </ul>
      )}
    </>
  );
}

// "2h ago" style, short
function ago(d: Date) {
  const mins = Math.max(1, Math.round((Date.now() - d.getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return days < 30 ? `${days}d ago` : submitted.format(d);
}

const tiny = "text-[0.7rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase";

function RequestCard({ r, n }: { r: RaceRequestRow; n: number }) {
  const pill =
    r.status === "pending"
      ? "bg-brand-light/20 text-link"
      : r.status === "approved"
        ? "bg-marking text-marking-foreground"
        : "bg-destructive/10 text-destructive";
  return (
    <li className="grid content-start gap-6 rounded-2xl bg-card p-6 ring-1 ring-border md:p-8">
      <div className="flex items-start justify-between gap-3">
        <p className={tiny}>Request {String(n).padStart(2, "0")}</p>
        <span title={`Sent ${submitted.format(r.createdAt)}`} className={`rounded-full px-3 py-1 text-[0.7rem] font-bold tracking-[0.12em] uppercase ${pill}`}>
          {r.status === "pending" ? ago(r.createdAt) : LABEL[r.status]}
        </span>
      </div>

      <div>
        <p className={tiny}>Organization</p>
        <p className="mt-1 font-semibold">{r.organization}</p>
      </div>

      <h2 className="font-[family-name:var(--font-oswald)] text-3xl leading-tight font-bold tracking-tight uppercase">{r.raceTitle}</h2>

      <dl className="grid overflow-hidden rounded-xl text-sm ring-1 ring-border sm:grid-cols-2 [&>div]:p-4 [&>div:nth-child(-n+2)]:border-b">
        <Detail label="Preferred date" value={formatDate(r.proposedDate)} />
        <Detail label="Location" value={r.location} />
        <Detail label="Expected runners" value={r.expectedRunners ? r.expectedRunners.toLocaleString("en-PH") : "Not given"} />
        <Detail label="Distances" value={r.distances ?? "Not given"} />
      </dl>

      {r.message && (
        <div>
          <p className={tiny}>Notes</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.message}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t pt-5 text-sm">
        <p>Contact: {r.contactName}</p>
        <a href={`mailto:${r.email}?subject=${encodeURIComponent(`Your RaceLink request: ${r.raceTitle}`)}`} className="text-link hover:underline">
          {r.email}
        </a>
        {r.phone && (
          <a href={`tel:${r.phone}`} className="text-muted-foreground hover:text-foreground">
            {r.phone}
          </a>
        )}
      </div>

      {r.status === "pending" ? (
        <RequestActions id={r.id} organization={r.organization} raceTitle={r.raceTitle} />
      ) : (
        <div className="grid gap-1 text-sm text-muted-foreground">
          <p>
            {r.status === "approved" ? "Approved" : "Rejected"} by {r.reviewerName ?? "an organizer"}
            {r.reviewedAt && ` on ${submitted.format(r.reviewedAt)}`}.
          </p>
          {r.reviewNote && <p className="text-foreground">Reason: {r.reviewNote}</p>}
          {r.eventId && (
            <Link href={`/organizer/events/${r.eventId}`} className="inline-flex items-center gap-1 font-semibold text-link hover:underline">
              Open race: {r.eventTitle} <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          )}
        </div>
      )}
    </li>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
