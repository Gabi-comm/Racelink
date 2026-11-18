import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CheckCircle2, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatPeso, formatTime } from "@/lib/events";
import { getMyBookings, type MyBooking } from "@/lib/queries/bookings";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { MiniBib } from "@/components/mini-bib";
import { CancelBookingButton, ResubmitForm } from "./booking-actions";

export const metadata: Metadata = { title: "My bookings" };

export default function BookingsPage({ searchParams }: PageProps<"/bookings">) {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">My bookings</h1>
        <p className="mt-1 text-muted-foreground">Your race registrations, payment status and bib numbers.</p>
      </div>
      <Suspense fallback={<div className="h-64 rounded-lg bg-card ring-1 ring-border" />}>
        <Bookings searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Bookings({ searchParams }: Pick<PageProps<"/bookings">, "searchParams">) {
  const user = await requireUser();
  const [list, query] = await Promise.all([getMyBookings(user.id), searchParams]);
  const justRegistered = Number(query.registered);

  if (list.length === 0) {
    return (
      <div className="rounded-lg bg-card p-10 text-center ring-1 ring-border">
        <p className="font-display text-2xl font-bold">No races yet</p>
        <p className="mt-2 text-muted-foreground">Pick a race, register, and it shows up here with your payment status.</p>
        <Link href="/#races" className={buttonVariants({ size: "lg", className: "mt-5" })}>
          Browse races
        </Link>
      </div>
    );
  }

  return (
    <>
      {list.some((b) => b.id === justRegistered) && (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
          <CheckCircle2 className="size-4" aria-hidden /> Registration sent. The organizer will check your receipt.
        </p>
      )}
      <ul className="grid gap-4">
        {list.map((b) => (
          <BookingCard key={b.id} booking={b} highlight={b.id === justRegistered} />
        ))}
      </ul>
    </>
  );
}

const STATUS: Record<MyBooking["status"], { label: string; className: string }> = {
  pending: { label: "Payment under review", className: "bg-amber-100 text-amber-900" },
  approved: { label: "Confirmed", className: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Payment rejected", className: "bg-red-100 text-red-800" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
};

function BookingCard({ booking: b, highlight }: { booking: MyBooking; highlight: boolean }) {
  const latest = b.proofs[0];
  const start = formatTime(b.startTime);
  const raceCancelled = b.eventStatus === "cancelled";
  const status = STATUS[b.status];

  return (
    <li
      id={`booking-${b.id}`}
      className={cn(
        "grid scroll-mt-24 gap-5 rounded-lg bg-card p-5 ring-1 ring-border md:grid-cols-[1fr_auto] md:p-6",
        highlight && "ring-2 ring-primary",
      )}
    >
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", status.className)}>{status.label}</span>
          {raceCancelled && <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">Race cancelled</span>}
        </div>
        <div>
          <h2 className="font-display text-2xl leading-tight font-bold">{b.title}</h2>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden />
              {formatDate(b.eventDate)}
              {start && `, ${start}`}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden />
              {b.location}
            </span>
          </p>
        </div>
        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Distance</dt>
            <dd className="font-display text-lg font-bold">{b.distanceLabel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Shirt</dt>
            <dd className="font-display text-lg font-bold">{b.tshirtSize}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Fee</dt>
            <dd className="font-display text-lg font-bold tabular-nums">{formatPeso(b.price)}</dd>
          </div>
        </dl>

        <StatusNote booking={b} />

        {latest && b.status !== "cancelled" && (
          <a href={`/api/receipts/${latest.id}`} target="_blank" rel="noreferrer" className="justify-self-start text-sm font-medium text-primary hover:underline">
            View your latest receipt
          </a>
        )}

        {b.status === "rejected" && !raceCancelled && <ResubmitForm bookingId={b.id} />}

        <div className="flex flex-wrap gap-2">
          {(b.status === "pending" || b.status === "rejected") && <CancelBookingButton bookingId={b.id} title={b.title} />}
          {b.status === "cancelled" && b.eventStatus === "open" && (
            <Link href={`/register/${b.eventId}`} className={buttonVariants({ variant: "outline" })}>
              Register again
            </Link>
          )}
        </div>
      </div>

      {b.status === "approved" && b.bibNumber !== null && <MiniBib number={b.bibNumber} attended={b.attended} className="md:justify-self-end" />}
    </li>
  );
}

function StatusNote({ booking: b }: { booking: MyBooking }) {
  const latest = b.proofs[0];
  if (b.status === "pending") {
    return <p className="text-sm">The organizer is checking your receipt. You&apos;ll get a bib number once it&apos;s approved.</p>;
  }
  if (b.status === "approved") {
    return <p className="text-sm">You&apos;re in. Bring a valid ID when you claim your race kit.</p>;
  }
  if (b.status === "rejected") {
    return (
      <div className="rounded-lg bg-red-50 p-3 text-sm text-red-900 ring-1 ring-red-200">
        <p className="font-semibold">The organizer couldn&apos;t confirm your payment.</p>
        {latest?.reviewNote && <p className="mt-1">Reason: {latest.reviewNote}</p>}
        <p className="mt-1">Upload a new receipt below to send it again.</p>
        {b.paymentInstructions && <p className="mt-2 whitespace-pre-line text-red-950/80">{b.paymentInstructions}</p>}
      </div>
    );
  }
  return <p className="text-sm text-muted-foreground">You cancelled this registration.</p>;
}
