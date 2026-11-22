import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Mail, MapPin, Phone, Route, Users, XCircle } from "lucide-react";
import { FilterTabs } from "@/components/filter-tabs";
import { EmptyState, PageHeader } from "@/components/stat";
import { StatusMark } from "@/components/status-badge";
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
        title="Request forms"
        description="Race requests from organizations. Approving one creates a draft race for you to finish. Every organizer sees the same list."
      />
      <Suspense fallback={<div className="h-96 rounded-lg bg-card ring-1 ring-border" />}>
        <Requests searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Requests({ searchParams }: Pick<PageProps<"/organizer/requests">, "searchParams">) {
  await requireUser("organizer", "admin");
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
        <ul className="grid gap-4 lg:grid-cols-2">
          {list.map((r) => (
            <RequestCard key={r.id} r={r} />
          ))}
        </ul>
      )}
    </>
  );
}

function RequestCard({ r }: { r: RaceRequestRow }) {
  return (
    <li className="grid content-start gap-4 rounded-lg bg-card p-5 ring-1 ring-border">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">{r.organization}</p>
          <h2 className="font-display text-xl leading-tight font-bold">{r.raceTitle}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Sent {submitted.format(r.createdAt)}</p>
        </div>
        {r.status === "pending" ? (
          <StatusMark tone="warning" icon={Clock3}>
            Waiting
          </StatusMark>
        ) : r.status === "approved" ? (
          <StatusMark tone="success" icon={CheckCircle2}>
            Approved
          </StatusMark>
        ) : (
          <StatusMark tone="danger" icon={XCircle}>
            Rejected
          </StatusMark>
        )}
      </div>

      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <Detail icon={CalendarDays} label="Preferred date" value={formatDate(r.proposedDate)} />
        <Detail icon={MapPin} label="Location" value={r.location} />
        <Detail icon={Users} label="Expected runners" value={r.expectedRunners ? r.expectedRunners.toLocaleString("en-PH") : "Not given"} />
        <Detail icon={Route} label="Distances" value={r.distances ?? "Not given"} />
      </dl>

      {r.message && <p className="rounded-md bg-muted/60 px-3 py-2 text-sm leading-relaxed">{r.message}</p>}

      <div className="grid gap-1 border-t pt-3 text-sm">
        <p className="font-semibold">{r.contactName}</p>
        <a href={`mailto:${r.email}?subject=${encodeURIComponent(`Your RaceLink request: ${r.raceTitle}`)}`} className="flex items-center gap-2 text-primary hover:underline">
          <Mail className="size-4" aria-hidden /> {r.email}
        </a>
        {r.phone && (
          <a href={`tel:${r.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <Phone className="size-4" aria-hidden /> {r.phone}
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
            <Link href={`/organizer/events/${r.eventId}`} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
              Open race: {r.eventTitle} <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          )}
        </div>
      )}
    </li>
  );
}

function Detail({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="font-medium">{value}</dd>
      </div>
    </div>
  );
}
