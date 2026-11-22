import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PaymentDetails } from "@/components/payment-details";
import { Ban, CalendarDays, CheckCircle2, MapPin } from "lucide-react";
import { RaceProgress } from "@/components/runner/race-progress";
import { BookingStatusMark, StatusMark } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatPeso, formatTime, todayInManila } from "@/lib/events";
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
        <h1 className="font-display text-3xl font-bold tracking-tight">My bookings</h1>
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
  const today = todayInManila();
  const isPast = (b: MyBooking) => b.eventDate < today || b.status === "cancelled" || b.eventStatus === "cancelled";
  const upcoming = list.filter((b) => !isPast(b));
  const past = list.filter(isPast).sort((a, b) => b.eventDate.localeCompare(a.eventDate));

  if (list.length === 0) {
    return (
      <div className="rounded-lg bg-card p-10 text-center ring-1 ring-border">
        <p className="font-display text-2xl font-bold">No races yet</p>
        <p className="mt-2 text-muted-foreground">Pick a race, register, and it shows up here with your payment status.</p>
        <Link href="/races" className={buttonVariants({ size: "lg", className: "mt-5" })}>
          Browse races
        </Link>
      </div>
    );
  }

  return (
    <>
      {list.some((b) => b.id === justRegistered) && (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-card px-4 py-3 text-sm font-medium shadow-[inset_3px_0_0_var(--success)] ring-1 ring-border [&>svg]:text-success">
          <CheckCircle2 className="size-4" aria-hidden /> Registration sent. The organizer will check your receipt.
        </p>
      )}
      <Group title="Upcoming" items={upcoming} highlight={justRegistered} />
      {past.length > 0 && <Group title="Past and cancelled" items={past} highlight={justRegistered} />}
    </>
  );
}

const STATUS_LABEL: Record<MyBooking["status"], string> = {
  pending: "Payment under review",
  approved: "Confirmed",
  rejected: "Payment rejected",
  cancelled: "Cancelled",
};

function Group({ title, items, highlight }: { title: string; items: MyBooking[]; highlight: number }) {
  return (
    <section className="grid gap-3">
      <h2 className="font-display text-lg font-bold">
        {title} <span className="text-sm font-medium text-muted-foreground tabular-nums">{items.length}</span>
      </h2>
      {items.length === 0 ? (
        <p className="rounded-lg bg-card px-5 py-6 text-sm text-muted-foreground ring-1 ring-border">
          Nothing coming up.{" "}
          <Link href="/races" className="font-semibold text-primary hover:underline">
            Find your next race
          </Link>
        </p>
      ) : (
        <ul className="grid gap-4">
          {items.map((b) => (
            <BookingCard key={b.id} booking={b} highlight={b.id === highlight} />
          ))}
        </ul>
      )}
    </section>
  );
}

function BookingCard({ booking: b, highlight }: { booking: MyBooking; highlight: boolean }) {
  const latest = b.proofs[0];
  const start = formatTime(b.startTime);
  const raceCancelled = b.eventStatus === "cancelled";

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
          <BookingStatusMark status={b.status} label={STATUS_LABEL[b.status]} />
          {raceCancelled && (
            <StatusMark tone="danger" icon={Ban}>
              Race cancelled
            </StatusMark>
          )}
        </div>
        <div>
          <h3 className="font-display text-xl leading-tight font-bold">{b.title}</h3>
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

        {!raceCancelled && <RaceProgress status={b.status} attended={b.attended} className="max-w-xl" />}

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
      <div className="rounded-lg bg-destructive/[0.04] p-3 text-sm shadow-[inset_3px_0_0_var(--destructive)] ring-1 ring-destructive/15">
        <p className="font-semibold text-destructive">The organizer couldn&apos;t confirm your payment.</p>
        {latest?.reviewNote && <p className="mt-1">Reason: {latest.reviewNote}</p>}
        <p className="mt-1">Upload a new receipt below to send it again.</p>
        <PaymentDetails info={b} className="mt-2 text-muted-foreground" />
      </div>
    );
  }
  return <p className="text-sm text-muted-foreground">You cancelled this registration.</p>;
}
