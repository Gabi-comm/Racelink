import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, ArrowRight, CalendarDays, MapPin, UserRound } from "lucide-react";
import { PILL, RaceCard } from "@/components/races/race-card";
import { RaceProgress } from "@/components/runner/race-progress";
import { Stat } from "@/components/stat";
import { BookingStatusMark } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { dateParts, formatDate, formatTime, todayInManila } from "@/lib/events";
import { getRunnerDashboard } from "@/lib/queries/dashboard";
import { homeFor } from "@/lib/roles";
import { requireUser, type CurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Home" };

export default function DashboardPage() {
  return <Dashboard />;
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
        {next ? (
          <div className="dark overflow-hidden rounded-2xl bg-[#172340] text-foreground">
            <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8 lg:grid-cols-[1fr_auto_auto] lg:gap-10">
              <div className="grid content-start gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 id="next-race" className={cn(PILL, "bg-marking text-marking-foreground")}>
                    Next scheduled race
                  </h2>
                  <span className="text-xs font-semibold tracking-[0.12em] text-brand-light uppercase">{countdown(next.eventDate)}</span>
                </div>
                <p className="font-[family-name:var(--font-oswald)] text-3xl leading-tight font-bold uppercase md:text-4xl">{next.title}</p>
                <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-4" aria-hidden />
                    {formatDate(next.eventDate)}
                    {formatTime(next.startTime) && ` · ${formatTime(next.startTime)}`}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-4" aria-hidden />
                    {next.location}
                  </span>
                </p>
              </div>
              {next.status === "approved" && next.bibNumber !== null ? (
                <div className="min-w-52 rounded-xl border-2 border-marking px-5 py-4 text-center">
                  <p className="text-[0.65rem] font-bold tracking-[0.2em] text-muted-foreground uppercase">Official race bib</p>
                  <p className="mt-1 font-[family-name:var(--font-oswald)] text-5xl leading-none font-bold tracking-wide text-marking tabular-nums">
                    {String(next.bibNumber).padStart(4, "0")}
                  </p>
                  <p className="mt-2 text-xs font-semibold tracking-[0.12em] uppercase">
                    {first} · {next.distanceLabel}
                  </p>
                </div>
              ) : (
                <div className="grid min-h-28 min-w-52 place-items-center rounded-xl border-2 border-dashed border-white/25 px-5 py-4 text-center text-sm font-medium text-muted-foreground">
                  Bib shows here once your payment is approved
                </div>
              )}
              <Link
                href={`/bookings#booking-${next.id}`}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/25 px-5 text-sm font-semibold transition-colors hover:bg-white/10 md:col-span-2 lg:col-span-1"
              >
                View race pass <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="border-t border-white/10 px-6 py-4 md:px-8">
              <RaceProgress status={next.status} />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-card p-10 text-center ring-1 ring-border">
            <h2 id="next-race" className="font-[family-name:var(--font-oswald)] text-2xl font-bold uppercase">
              No races lined up
            </h2>
            <p className="mt-2 text-muted-foreground">Pick a race below or browse the full list. Your bib shows up here once you&apos;re confirmed.</p>
            <Link href="/races" className={buttonVariants({ size: "lg", className: "mt-5 h-12 px-5" })}>
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
                    className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-4 rounded-lg bg-card px-4 py-3 ring-1 ring-border transition-colors hover:ring-link/50"
                  >
                    <span className="grid text-center leading-none">
                      <span className="text-xs font-semibold text-link uppercase">{d.month}</span>
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
        <section aria-labelledby="open-races" className="grid gap-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-link uppercase">Open for registration</p>
              <h2 id="open-races" className="mt-1 font-[family-name:var(--font-oswald)] text-3xl font-bold uppercase">
                Available races to join
              </h2>
            </div>
            <Link href="/races" className="inline-flex items-center gap-1 text-sm font-semibold text-link hover:underline">
              All races <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {openRaces.map((r, i) => (
              <li key={r.id}>
                <RaceCard
                  race={r}
                  n={i}
                  badge={i === 0 ? "Next race" : undefined}
                  actions={
                    <>
                      <Link href={`/races?event=${r.id}`} className="text-sm font-semibold text-link hover:underline">
                        Details
                      </Link>
                      <Link href={`/register/${r.id}`} className={buttonVariants({ className: "h-11 gap-2 px-4 text-base" })}>
                        Register <ArrowRight className="size-4" aria-hidden />
                      </Link>
                    </>
                  }
                />
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
        tone === "red" ? "shadow-[inset_3px_0_0_var(--destructive)] [&>span:first-child]:text-destructive" : "shadow-[inset_3px_0_0_var(--primary)] [&>span:first-child]:text-link",
      )}
    >
      <span className="mt-px shrink-0">{icon}</span>
      <span>{children}</span>
    </p>
  );
}
