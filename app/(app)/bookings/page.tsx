import { ReceiptPreview } from "@/components/receipt-preview";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Receipt } from "lucide-react";
import { FilterTabs } from "@/components/filter-tabs";
import { PaymentDetails } from "@/components/payment-details";
import { BookingStatusMark } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { dateParts, formatPeso, formatTime, todayInManila } from "@/lib/events";
import { getMyBookings, getRunnerPhone, type MyBooking } from "@/lib/queries/bookings";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { CancelBookingButton, RefundRequestButton, ResubmitForm } from "./booking-actions";

export const metadata: Metadata = { title: "My bookings" };

const PILL = "inline-flex items-center rounded-full px-3 py-1 text-[0.7rem] font-bold tracking-[0.12em] whitespace-nowrap uppercase";
const OSWALD = "font-[family-name:var(--font-oswald)]";

export default function BookingsPage({ searchParams }: PageProps<"/bookings">) {
  return (
    <div className="grid gap-8">
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-link uppercase">Your race history</p>
        <h1 className={cn(OSWALD, "mt-2 text-5xl font-bold uppercase md:text-6xl")}>My bookings</h1>
        <p className="mt-2 text-muted-foreground">Everything from payment review to race-day bib.</p>
      </div>
      <Bookings searchParams={searchParams} />
    </div>
  );
}

const TABS = [
  { value: "all", label: "All" },
  { value: "approved", label: "Verified" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
] as const;
type Tab = (typeof TABS)[number]["value"];

async function Bookings({ searchParams }: Pick<PageProps<"/bookings">, "searchParams">) {
  const user = await requireUser();
  const [list, phone, query] = await Promise.all([getMyBookings(user.id), getRunnerPhone(user.id), searchParams]);
  const contact = { email: user.email, phone };
  const justRegistered = Number(query.registered);
  const tab: Tab = TABS.some((t) => t.value === query.status) ? (query.status as Tab) : "all";
  const today = todayInManila();
  const isPast = (b: MyBooking) => b.eventDate < today || b.status === "cancelled" || b.eventStatus === "cancelled";

  if (list.length === 0) {
    return (
      <div className="rounded-2xl bg-card p-10 text-center ring-1 ring-border">
        <p className={cn(OSWALD, "text-2xl font-bold uppercase")}>No races yet</p>
        <p className="mt-2 text-muted-foreground">Pick a race, register, and it shows up here with your payment status.</p>
        <Link href="/races" className={buttonVariants({ size: "lg", className: "mt-5 h-12 gap-2 px-5" })}>
          Browse races <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    );
  }

  // upcoming muna, tapos past (latest first)
  const upcoming = list.filter((b) => !isPast(b));
  const past = list.filter(isPast).sort((a, b) => b.eventDate.localeCompare(a.eventDate));
  const shown = [...upcoming, ...past].filter((b) => tab === "all" || b.status === tab);
  const count = (t: Tab) => (t === "all" ? list.length : list.filter((b) => b.status === t).length);

  return (
    <>
      {list.some((b) => b.id === justRegistered) && (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-card px-4 py-3 text-sm font-medium shadow-[inset_3px_0_0_var(--success)] ring-1 ring-border [&>svg]:text-success">
          <CheckCircle2 className="size-4" aria-hidden /> Registration sent. The organizer will check your receipt.
        </p>
      )}

      <FilterTabs
        label="Booking status"
        items={TABS.filter((t) => t.value !== "cancelled" || count("cancelled") > 0).map((t) => ({
          href: t.value === "all" ? "/bookings" : `/bookings?status=${t.value}`,
          label: t.label,
          count: count(t.value),
          active: tab === t.value,
        }))}
      />

      {shown.length === 0 ? (
        <p className="rounded-2xl bg-card px-6 py-10 text-center text-muted-foreground ring-1 ring-border">No bookings here.</p>
      ) : (
        <ul className="grid gap-4">
          {shown.map((b) => (
            <BookingCard key={b.id} booking={b} past={isPast(b)} highlight={b.id === justRegistered} contact={contact} />
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-2">
        <p className="text-muted-foreground">Looking for another challenge?</p>
        <Link href="/races" className={buttonVariants({ size: "lg", className: "h-12 gap-2 px-6 text-base" })}>
          Browse races <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </>
  );
}

const STATUS_LABEL: Record<MyBooking["status"], string> = {
  pending: "Payment review",
  approved: "Verified",
  rejected: "Payment rejected",
  cancelled: "Cancelled",
};

type Contact = { email: string; phone: string };

function BookingCard({ booking: b, past, highlight, contact }: { booking: MyBooking; past: boolean; highlight: boolean; contact: Contact }) {
  const latest = b.proofs[0];
  const start = formatTime(b.startTime);
  const raceCancelled = b.eventStatus === "cancelled";
  const { day, month, year } = dateParts(b.eventDate);
  const hasBib = b.status === "approved" && b.bibNumber !== null;
  const showReceipt = latest && b.status !== "cancelled";
  // money already sent (pending or confirmed) goes through a refund request; a rejected payment just cancels
  const canRefund = b.status === "pending" || b.status === "approved";
  const canCancel = b.status === "rejected" && !raceCancelled;
  const canRegisterAgain = b.status === "cancelled" && b.eventStatus === "open";
  const note = statusNote(b);

  return (
    <li
      id={`booking-${b.id}`}
      className={cn("scroll-mt-24 overflow-hidden rounded-2xl bg-card ring-1 ring-border", highlight && "ring-2 ring-link")}
    >
      <div className="grid gap-5 p-5 md:grid-cols-[auto_1fr] md:items-center md:gap-x-7 md:p-6 lg:grid-cols-[auto_1fr_auto_15rem]">
        <div className={cn("flex items-center gap-2.5 md:border-r md:pr-7", past && "opacity-60")}>
          <span className={cn(OSWALD, "text-5xl leading-none font-bold tabular-nums")}>{day.padStart(2, "0")}</span>
          <span className="grid text-xs leading-tight font-bold text-link uppercase">
            <span>{month}</span>
            <span>{year}</span>
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <BookingStatusMark status={b.status} label={STATUS_LABEL[b.status]} />
            {b.refund?.status === "requested" && <span className={cn(PILL, "bg-warning/15 text-warning")}>Refund requested</span>}
            {b.refund?.status === "processed" && <span className={cn(PILL, "bg-success/15 text-success")}>Refund sent</span>}
            {raceCancelled && <span className={cn(PILL, "bg-destructive/10 text-destructive")}>Race cancelled</span>}
          </div>
          <h2 className={cn(OSWALD, "mt-2.5 text-2xl leading-tight font-bold uppercase md:text-3xl", past && "text-muted-foreground")}>{b.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {b.location}
            {start && ` · ${start}`}
          </p>
        </div>

        <dl className="flex gap-8 md:col-start-2 lg:col-start-auto">
          <Fact label="Distance" value={b.distanceLabel} />
          <Fact label="Shirt" value={b.tshirtSize} />
          <Fact label="Fee" value={formatPeso(b.price)} />
        </dl>

        {hasBib ? (
          <div className="dark grid h-28 place-content-center rounded-xl bg-[#172340] text-center text-foreground md:col-span-2 lg:col-span-1">
            <p className="text-[0.6rem] font-bold tracking-[0.2em] text-marking uppercase">Bib number</p>
            <p className={cn(OSWALD, "mt-1 text-4xl leading-none font-bold tabular-nums")}>{String(b.bibNumber).padStart(4, "0")}</p>
          </div>
        ) : (
          <div className="grid h-28 place-content-center rounded-xl bg-[#868b99] text-center text-white md:col-span-2 lg:col-span-1">
            <p className="text-[0.6rem] font-bold tracking-[0.2em] text-[#e2f57a] uppercase">Bib number</p>
            <p className={cn(OSWALD, "mt-1 text-3xl leading-none font-bold uppercase")}>{b.status === "cancelled" || raceCancelled ? "None" : "Unassigned"}</p>
          </div>
        )}
      </div>

      {(note || (b.status === "rejected" && !raceCancelled)) && (
        <div className="grid gap-4 border-t px-5 py-4 md:px-6">
          {note}
          {b.status === "rejected" && !raceCancelled && <ResubmitForm bookingId={b.id} />}
        </div>
      )}

      {(showReceipt || canCancel || canRefund || canRegisterAgain) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/40 px-5 py-2.5 md:px-6">
          {showReceipt ? (
            <ReceiptPreview receiptId={latest.id} className="inline-flex items-center gap-1.5 text-sm font-medium text-link underline-offset-4 hover:underline">
              <Receipt className="size-4" aria-hidden /> View your latest receipt
            </ReceiptPreview>
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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.65rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 font-bold whitespace-nowrap tabular-nums uppercase">{value}</dd>
    </div>
  );
}

// extra info lang kapag may kailangang gawin o malaman
function statusNote(b: MyBooking) {
  const latest = b.proofs[0];
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
  return null;
}
