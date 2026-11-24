import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PaymentDetails } from "@/components/payment-details";
import { Ban, CalendarDays, CheckCircle2, Clock3, Hourglass, MapPin, Receipt, Route, Shirt, Wallet } from "lucide-react";
import { RaceProgress } from "@/components/runner/race-progress";
import { BookingStatusMark, StatusMark } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { dateParts, formatDate, formatPeso, formatTime, todayInManila } from "@/lib/events";
import { getMyBookings, getRunnerPhone, type MyBooking } from "@/lib/queries/bookings";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { MiniBib } from "@/components/mini-bib";
import { CancelBookingButton, RefundRequestButton, ResubmitForm } from "./booking-actions";

export const metadata: Metadata = { title: "My bookings" };

export default function BookingsPage({ searchParams }: PageProps<"/bookings">) {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">My bookings</h1>
      </div>
      <Suspense fallback={<div className="h-64 rounded-lg bg-card ring-1 ring-border" />}>
        <Bookings searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Bookings({ searchParams }: Pick<PageProps<"/bookings">, "searchParams">) {
  const user = await requireUser();
  const [list, phone, query] = await Promise.all([getMyBookings(user.id), getRunnerPhone(user.id), searchParams]);
  const contact = { email: user.email, phone };
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
      <Group title="Upcoming" items={upcoming} highlight={justRegistered} contact={contact} />
      {past.length > 0 && <Group title="Past and cancelled" items={past} highlight={justRegistered} contact={contact} />}
    </>
  );
}

const STATUS_LABEL: Record<MyBooking["status"], string> = {
  pending: "Payment under review",
  approved: "Confirmed",
  rejected: "Payment rejected",
  cancelled: "Cancelled",
};

type Contact = { email: string; phone: string };

function Group({ title, items, highlight, contact }: { title: string; items: MyBooking[]; highlight: number; contact: Contact }) {
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
            <BookingCard key={b.id} booking={b} highlight={b.id === highlight} contact={contact} />
          ))}
        </ul>
      )}
    </section>
  );
}

function BookingCard({ booking: b, highlight, contact }: { booking: MyBooking; highlight: boolean; contact: Contact }) {
  const latest = b.proofs[0];
  const start = formatTime(b.startTime);
  const raceCancelled = b.eventStatus === "cancelled";
  const { day, month, weekday } = dateParts(b.eventDate);
  const inactive = b.status === "cancelled" || raceCancelled;
  const hasBib = b.status === "approved" && b.bibNumber !== null;
  const showReceipt = latest && b.status !== "cancelled";
  // money already sent (pending or confirmed) goes through a refund request; a rejected payment just cancels
  const canRefund = b.status === "pending" || b.status === "approved";
  const canCancel = b.status === "rejected" && !raceCancelled;
  const canRegisterAgain = b.status === "cancelled" && b.eventStatus === "open";

  return (
    <li
      id={`booking-${b.id}`}
      className={cn(
        "scroll-mt-24 overflow-hidden rounded-xl bg-card ring-1 ring-border transition-shadow hover:shadow-[0_12px_32px_-20px_rgb(0_0_0/0.35)]",
        highlight && "ring-2 ring-primary",
      )}
    >
      <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:gap-8 md:p-6">
        <div className="grid min-w-0 gap-5">
          {/* header: date tile + race */}
          <div className="flex gap-4">
            <div
              className={cn(
                "flex w-16 shrink-0 flex-col items-center self-start rounded-lg border bg-background py-2 text-center",
                inactive && "opacity-60",
              )}
            >
              <span className="text-xs font-bold text-primary uppercase">{month}</span>
              <span className="font-display text-3xl leading-none font-extrabold tabular-nums">{day}</span>
              <span className="text-[11px] text-muted-foreground">{weekday}</span>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <BookingStatusMark status={b.status} label={STATUS_LABEL[b.status]} />
                {b.refund?.status === "requested" && (
                  <StatusMark tone="warning" icon={Clock3}>
                    Refund requested
                  </StatusMark>
                )}
                {b.refund?.status === "processed" && (
                  <StatusMark tone="success" icon={CheckCircle2}>
                    Refund processed
                  </StatusMark>
                )}
                {raceCancelled && (
                  <StatusMark tone="danger" icon={Ban}>
                    Race cancelled
                  </StatusMark>
                )}
              </div>
              <h3 className={cn("mt-1 font-display text-xl leading-tight font-bold md:text-2xl", inactive && "text-muted-foreground")}>
                {b.title}
              </h3>
              <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-4 shrink-0" aria-hidden />
                  {formatDate(b.eventDate)}
                  {start && `, ${start}`}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4 shrink-0" aria-hidden />
                  {b.location}
                </span>
              </p>
            </div>
          </div>

          {/* what they signed up for */}
          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-border ring-1 ring-border">
            <Fact icon={Route} label="Distance" value={b.distanceLabel} />
            <Fact icon={Shirt} label="Shirt" value={b.tshirtSize} />
            <Fact icon={Wallet} label="Fee" value={formatPeso(b.price)} />
          </dl>

          {!raceCancelled && <RaceProgress status={b.status} />}

          <StatusNote booking={b} />

          {b.status === "rejected" && !raceCancelled && <ResubmitForm bookingId={b.id} />}
        </div>

        {/* bib: the real one once confirmed, an empty slot while the payment is checked */}
        {hasBib ? (
          <MiniBib number={b.bibNumber!} className="md:mt-1 md:justify-self-end" />
        ) : b.status === "pending" && !raceCancelled ? (
          <div className="hidden w-44 self-start rounded-md border-2 border-dashed p-4 text-center md:mt-1 md:block md:justify-self-end">
            <Hourglass className="mx-auto size-5 text-muted-foreground" aria-hidden />
            <p className="mt-2 text-sm font-semibold">Bib number</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Assigned once your payment is approved</p>
          </div>
        ) : null}
      </div>

      {(showReceipt || canCancel || canRefund || canRegisterAgain) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/40 px-5 py-2.5 md:px-6">
          {showReceipt ? (
            <a
              href={`/api/receipts/${latest.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              <Receipt className="size-4" aria-hidden /> View your latest receipt
            </a>
          ) : (
            <span />
          )}
          {/* -mx lines the ghost button's text up with the card edge */}
          <div className="-mx-2.5 flex flex-wrap gap-2">
            {canCancel && <CancelBookingButton bookingId={b.id} title={b.title} />}
            {canRefund && (
              <RefundRequestButton
                bookingId={b.id}
                title={b.title}
                amount={formatPeso(latest?.amount ?? b.price)}
                email={contact.email}
                phone={contact.phone}
                raceCancelled={raceCancelled}
              />
            )}
            {canRegisterAgain && (
              <Link href={`/register/${b.eventId}`} className={buttonVariants({ variant: "outline" })}>
                Register again
              </Link>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Route; label: string; value: string }) {
  return (
    <div className="bg-card px-3 py-2.5 sm:px-4">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        {label}
      </dt>
      <dd className="mt-0.5 font-display text-lg font-bold tabular-nums">{value}</dd>
    </div>
  );
}

function StatusNote({ booking: b }: { booking: MyBooking }) {
  const latest = b.proofs[0];
  if (b.status === "pending") {
    return <p className="text-sm text-muted-foreground">The organizer is checking your receipt. You&apos;ll get a bib number once it&apos;s approved.</p>;
  }
  if (b.status === "approved") {
    return <p className="text-sm text-muted-foreground">You&apos;re in. Bring a valid ID when you claim your race kit.</p>;
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
  if (b.refund?.status === "requested") {
    return <p className="text-sm text-muted-foreground">You cancelled this registration. The organizer is reviewing your refund of {formatPeso(b.refund.amount)}.</p>;
  }
  if (b.refund?.status === "processed") {
    return <p className="text-sm text-muted-foreground">You cancelled this registration. Your refund of {formatPeso(b.refund.amount)} was sent. Check your GCash or bank account.</p>;
  }
  return <p className="text-sm text-muted-foreground">You cancelled this registration.</p>;
}
