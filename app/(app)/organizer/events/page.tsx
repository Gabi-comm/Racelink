import { Suspense } from "react";
import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/stat";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilterTabs } from "@/components/filter-tabs";
import { formatDate, formatPeso, todayInManila } from "@/lib/events";
import { getManagedEvents } from "@/lib/queries/organizer";
import { requireUser } from "@/lib/session";
import { DeleteEventButton } from "../delete-event-button";

export const metadata: Metadata = { title: "Manage Events" };

const TABS = [
  { value: "current", label: "Current", hint: "Open for registration. Runners can sign up now." },
  { value: "upcoming", label: "Upcoming", hint: "Drafts and races with registration closed that haven't happened yet." },
  { value: "previous", label: "Previous", hint: "Races that already happened, and cancelled races." },
] as const;
type Tab = (typeof TABS)[number]["value"];

type Row = Awaited<ReturnType<typeof getManagedEvents>>[number];

function tabOf(r: Row, today: string): Tab {
  if (r.eventDate < today || r.status === "cancelled") return "previous";
  return r.status === "open" ? "current" : "upcoming";
}

export default function ManageEventsPage({ searchParams }: PageProps<"/organizer/events">) {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Manage events"
        description="Create races, and keep current, upcoming and past races up to date."
        actions={
          <Link href="/organizer/events/new" className={buttonVariants({ size: "lg", className: "h-10 px-4" })}>
            <Plus aria-hidden /> New race
          </Link>
        }
      />
      <Suspense fallback={<div className="h-96 rounded-lg bg-card ring-1 ring-border" />}>
        <Events searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Events({ searchParams }: Pick<PageProps<"/organizer/events">, "searchParams">) {
  const user = await requireUser("organizer");
  const [rows, query] = await Promise.all([getManagedEvents(user), searchParams]);
  const isAdmin = user.role === "admin";
  const today = todayInManila();

  const tab: Tab = TABS.some((t) => t.value === query.tab) ? (query.tab as Tab) : "current";
  const q = typeof query.q === "string" ? query.q.trim() : "";
  const needle = q.toLowerCase();
  const inTab = rows.filter((r) => tabOf(r, today) === tab);
  const shown = inTab
    .filter(
      (r) =>
        !needle ||
        r.title.toLowerCase().includes(needle) ||
        r.location.toLowerCase().includes(needle) ||
        (r.requestedBy ?? "").toLowerCase().includes(needle),
    )
    // current/upcoming: soonest first, previous: latest first
    .sort((a, b) => (tab === "previous" ? b.eventDate.localeCompare(a.eventDate) : a.eventDate.localeCompare(b.eventDate)));

  const href = (t: Tab) => {
    const p = new URLSearchParams();
    if (t !== "current") p.set("tab", t);
    if (q) p.set("q", q);
    const s = p.toString();
    return `/organizer/events${s ? `?${s}` : ""}`;
  };

  if (rows.length === 0) {
    return (
      <EmptyState
        title="You haven't posted a race yet"
        text="Create your first race, or approve a race request. You can keep it as a draft until it's ready."
        action={
          <Link href="/organizer/events/new" className={buttonVariants({ size: "lg" })}>
            Create a race
          </Link>
        }
      />
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          label="Race timeline"
          items={TABS.map((t) => ({ href: href(t.value), label: t.label, count: rows.filter((r) => tabOf(r, today) === t.value).length, active: tab === t.value }))}
        />
        <Form action="/organizer/events" className="relative w-full sm:w-72" role="search">
          {tab !== "current" && <input type="hidden" name="tab" value={tab} />}
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input name="q" defaultValue={q} placeholder="Race, place or organization" aria-label="Search races" className="h-9 pl-8" />
        </Form>
      </div>
      <p className="-mt-2 text-sm text-muted-foreground">{TABS.find((t) => t.value === tab)?.hint}</p>

      {shown.length === 0 ? (
        <EmptyState
          title={inTab.length === 0 ? `No ${TABS.find((t) => t.value === tab)?.label.toLowerCase()} races` : "No races match"}
          text={inTab.length === 0 ? "Races move between these tabs on their own as their status and date change." : "Try another search."}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg bg-card ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Race</TableHead>
                <TableHead>Race day</TableHead>
                <TableHead>Requested by</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Confirmed</TableHead>
                <TableHead className="text-right">To review</TableHead>
                {tab === "previous" ? (
                  <TableHead className="text-right">Checked in</TableHead>
                ) : (
                  <TableHead className="text-right">Fees confirmed</TableHead>
                )}
                {isAdmin && <TableHead>Organizer</TableHead>}
                <TableHead className="pr-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody key={`${tab}|${q}`} className="stagger">
              {shown.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="pl-4">
                    <Link href={`/organizer/events/${r.id}`} className="font-semibold hover:underline">
                      {r.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">{r.location}</p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(r.eventDate, "short")}</TableCell>
                  <TableCell className="max-w-48 text-sm">{r.requestedBy ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.approved}
                    {r.capacity ? <span className="text-muted-foreground"> / {r.capacity}</span> : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.pending > 0 ? (
                      <Link href={`/organizer/participants?event=${r.id}&status=pending`} className="font-semibold text-primary hover:underline">
                        {r.pending}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {tab === "previous" ? `${r.checkedIn} / ${r.approved}` : formatPeso(r.collected)}
                  </TableCell>
                  {isAdmin && <TableCell className="text-muted-foreground">{r.organizerName}</TableCell>}
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-1">
                      <Link href={`/organizer/participants?event=${r.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                        Participants
                      </Link>
                      <Link href={`/organizer/events/${r.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                        Edit
                      </Link>
                      <DeleteEventButton id={r.id} title={r.title} hasBookings={r.totalBookings > 0} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
