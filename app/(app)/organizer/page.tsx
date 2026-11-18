import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/events";
import { getManagedEvents } from "@/lib/queries/organizer";
import { requireUser } from "@/lib/session";
import { DeleteEventButton } from "./delete-event-button";

export const metadata: Metadata = { title: "Manage Events" };

export default function OrganizerPage() {
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Manage events</h1>
          <p className="mt-1 text-muted-foreground">Post races, set distances and fees, and keep race files up to date.</p>
        </div>
        <Link href="/organizer/events/new" className={buttonVariants({ size: "lg", className: "h-10 px-4" })}>
          <Plus aria-hidden /> New race
        </Link>
      </div>
      <Suspense fallback={<div className="h-64 rounded-lg bg-card ring-1 ring-border" />}>
        <EventsTable />
      </Suspense>
    </div>
  );
}

async function EventsTable() {
  const user = await requireUser("organizer", "admin");
  const rows = await getManagedEvents(user);
  const isAdmin = user.role === "admin";

  if (rows.length === 0) {
    return (
      <div className="rounded-lg bg-card p-10 text-center ring-1 ring-border">
        <p className="font-display text-2xl font-bold">You haven&apos;t posted a race yet</p>
        <p className="mt-2 text-muted-foreground">Create your first race. You can save it as a draft until it&apos;s ready.</p>
        <Link href="/organizer/events/new" className={buttonVariants({ size: "lg", className: "mt-5" })}>
          Create a race
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg bg-card ring-1 ring-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Race</TableHead>
            <TableHead>Race day</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Approved</TableHead>
            <TableHead className="text-right">Pending</TableHead>
            {isAdmin && <TableHead>Organizer</TableHead>}
            <TableHead className="pr-4 text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="pl-4">
                <Link href={`/organizer/events/${r.id}`} className="font-semibold hover:underline">
                  {r.title}
                </Link>
                <p className="text-sm text-muted-foreground">{r.location}</p>
              </TableCell>
              <TableCell className="whitespace-nowrap">{formatDate(r.eventDate, "short")}</TableCell>
              <TableCell>
                <StatusBadge status={r.status} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {r.approved}
                {r.capacity ? <span className="text-muted-foreground"> / {r.capacity}</span> : null}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {r.pending > 0 ? (
                  <Link href={`/organizer/events/${r.id}/registrations?status=pending`} className="rounded-md bg-amber-100 px-2 py-0.5 font-semibold text-amber-900 hover:underline">
                    {r.pending}
                  </Link>
                ) : (
                  r.pending
                )}
              </TableCell>
              {isAdmin && <TableCell className="text-muted-foreground">{r.organizerName}</TableCell>}
              <TableCell className="pr-4">
                <div className="flex justify-end gap-1">
                  <Link href={`/organizer/events/${r.id}/registrations`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                    Registrations
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
  );
}
