import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, ArrowRight, CalendarDays, MapPin, UserRound } from "lucide-react";
import { MiniBib } from "@/components/mini-bib";
import { RaceProgress } from "@/components/runner/race-progress";
import { Stat } from "@/components/stat";
import { BookingStatusMark } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { dateParts, formatDate, formatPeso, formatTime, todayInManila } from "@/lib/events";
import { getRunnerDashboard } from "@/lib/queries/dashboard";
import { homeFor } from "@/lib/roles";
import { requireUser, type CurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Home" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="h-96 rounded-lg bg-card ring-1 ring-border" />}>
      <Dashboard />
    </Suspense>
  );
}

// runner home; organizers and admins have their own workspace
async function Dashboard() {
  const user = await requireUser();
  if (user.role !== "runner") redirect(homeFor(user.role));
  return <RunnerView user={user} />;
}

function daysUntil(date: string) {
  const ms = new Date(`${date}T00:00:00Z`).getTime() - new Date(`${todayInManila()}T00:00:00Z`).getTime();
  return Math.round(ms / 86_400_000);
}

function countdown(date: string) {
  const d = daysUntil(date);
  return d === 0 ? "Race day is today" : d === 1 ? "Race day is tomorrow" : `${d} days to go`;
}

async function RunnerView({ user }: { user: CurrentUser }) {
  const { next, upcoming, needsAction, profileComplete, openRaces } = await getRunnerDashboard(user.id);
  const live = upcoming.filter((b) => b.eventStatus !== "cancelled");
  const others = live.filter((b) => b.id !== next?.id && b.status !== "rejected");
  const confirmed = live.filter((b) => b.status === "approved").length;
  const reviewing = live.filter((b) => b.status === "pending").length;
  const first = user.name.split(" ")[0];

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Hi, {first}</h1>
          <p className="mt-1 text-muted-foreground">Your races, bibs and anything that needs your attention.</p>
        </div>
        <Link href="/races" className={buttonVariants({ size: "lg", className: "h-10 px-4" })}>
          Find a race
        </Link>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        <Stat label="Upcoming races" value={live.filter((b) => b.status !== "rejected").length} href="/bookings" />
        <Stat label="Confirmed with a bib" value={confirmed} />
        <Stat label="Payments in review" value={reviewing} attention={needsAction.length > 0} detail={needsAction.length ? `${needsAction.length} need a new receipt` : undefined} />
      </dl>

      {(needsAction.length > 0 || !profileComplete) && (
        <div className="grid gap-3">
          {needsAction.map((b) => (
            <Notice key={b.id} tone="red" icon={<AlertCircle className="size-5" aria-hidden />}>
              The organizer couldn&apos;t confirm your payment for <strong>{b.title}</strong>.{" "}
              <Link href={`/bookings#booking-${b.id}`} className="font-semibold underline">
                Send a new receipt
              </Link>
            </Notice>
          ))}
          {!profileComplete && (
            <Notice tone="brand" icon={<UserRound className="size-5" aria-hidden />}>
              Add your mobile number and emergency contact so registering takes less time.{" "}
              <Link href="/profile" className="font-semibold underline">
                Complete your profile
              </Link>
            </Notice>
          )}
        </div>
      )}

      <section aria-labelledby="next-race">
        <h2 id="next-race" className="mb-3 font-display text-lg font-bold">
          Your next race
        </h2>
        {next ? (
          <div className="overflow-hidden rounded-lg bg-card ring-1 ring-border">
            <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:p-8">
              <div className="grid content-start gap-3">
                <p className="text-sm font-bold tracking-wide text-primary uppercase">{countdown(next.eventDate)}</p>
                <p className="font-display text-3xl leading-tight font-extrabold tracking-tight md:text-4xl">{next.title}</p>
                <p className="flex flex-wrap gap-x-5 gap-y-1 text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-4" aria-hidden />
                    {formatDate(next.eventDate)}
                    {formatTime(next.startTime) && `, ${formatTime(next.startTime)}`}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-4" aria-hidden />
                    {next.location}
                  </span>
                </p>
                <p>
                  Running the <strong>{next.distanceLabel}</strong>.{" "}
                  {next.status === "approved"
                    ? "You're confirmed. Bring a valid ID to claim your race kit."
                    : "Your receipt is with the organizer. Your bib shows up here once it's approved."}
                </p>
                <Link href={`/bookings#booking-${next.id}`} className="inline-flex items-center gap-1 justify-self-start text-sm font-semibold text-primary hover:underline">
                  Booking details <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </div>
              {next.status === "approved" && next.bibNumber !== null ? (
                <MiniBib number={next.bibNumber} attended={next.attended} className="md:justify-self-end" />
              ) : (
                <div className="grid h-36 w-44 -rotate-2 place-items-center self-start rounded-md border-2 border-dashed border-border p-4 text-center text-sm font-medium text-muted-foreground md:justify-self-end">
                  Bib shows here once your payment is approved
                </div>
              )}
            </div>
            <div className="border-t bg-muted/40 px-6 py-4 md:px-8">
              <RaceProgress status={next.status} attended={next.attended} />
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-card p-10 text-center ring-1 ring-border">
            <p className="font-display text-2xl font-bold">No races lined up</p>
            <p className="mt-2 text-muted-foreground">Pick a race below or browse the full list. Your bib shows up here once you&apos;re confirmed.</p>
            <Link href="/races" className={buttonVariants({ size: "lg", className: "mt-5" })}>
              Browse races
            </Link>
          </div>
        )}
      </section>

      {others.length > 0 && (
        <section className="grid gap-3">
          <h2 className="font-display text-lg font-bold">Also coming up</h2>
          <ol className="grid gap-2">
            {others.map((b) => {
              const d = dateParts(b.eventDate);
              return (
                <li key={b.id}>
                  <Link
                    href={`/bookings#booking-${b.id}`}
                    className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-4 rounded-lg bg-card px-4 py-3 ring-1 ring-border transition-colors hover:ring-primary/50"
                  >
                    <span className="grid text-center leading-none">
                      <span className="text-xs font-semibold text-primary uppercase">{d.month}</span>
                      <span className="font-display text-2xl font-extrabold tabular-nums">{d.day}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{b.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {b.distanceLabel} · {countdown(b.eventDate)}
                      </span>
                    </span>
                    {b.status === "approved" && b.bibNumber !== null ? (
                      <span className="font-display text-lg font-extrabold tabular-nums">#{String(b.bibNumber).padStart(4, "0")}</span>
                    ) : (
                      <BookingStatusMark status={b.status} label="In review" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {openRaces.length > 0 && (
        <section className="grid gap-3">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-lg font-bold">Open for registration</h2>
            <Link href="/races" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              All races <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <ul className="grid gap-3 md:grid-cols-3">
            {openRaces.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/races?event=${r.id}`}
                  className="grid h-full content-start gap-1 rounded-lg bg-card p-5 ring-1 ring-border transition-colors hover:ring-primary/50"
                >
                  <span className="text-sm font-semibold text-primary">{formatDate(r.eventDate, "short")}</span>
                  <span className="font-display text-lg leading-tight font-bold">{r.title}</span>
                  <span className="text-sm text-muted-foreground">{r.location}</span>
                  {r.priceFrom > 0 && <span className="mt-3 text-sm font-semibold">From {formatPeso(r.priceFrom)}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Notice({ tone, icon, children }: { tone: "red" | "brand"; icon: ReactNode; children: ReactNode }) {
  return (
    <p
      className={cn(
        "flex items-start gap-3 rounded-lg bg-card px-4 py-3 text-sm ring-1 ring-border",
        tone === "red" ? "shadow-[inset_3px_0_0_var(--destructive)] [&>span:first-child]:text-destructive" : "shadow-[inset_3px_0_0_var(--primary)] [&>span:first-child]:text-primary",
      )}
    >
      <span className="mt-px shrink-0">{icon}</span>
      <span>{children}</span>
    </p>
  );
}
