import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, CalendarDays, MapPin, UserRound } from "lucide-react";
import { MiniBib } from "@/components/mini-bib";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatPeso, formatTime, todayInManila } from "@/lib/events";
import { getAdminTotals, getOrganizerDashboard, getRunnerDashboard } from "@/lib/queries/dashboard";
import { requireUser, type CurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="h-96 rounded-lg bg-card ring-1 ring-border" />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const user = await requireUser();
  const first = user.name.split(" ")[0];
  const intro =
    user.role === "runner"
      ? "Your races, bibs and anything that needs your attention."
      : user.role === "organizer"
        ? "Payments waiting for you and how your upcoming races are filling up."
        : "Site-wide numbers, plus every upcoming race.";

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Hi, {first}</h1>
        <p className="mt-1 text-muted-foreground">{intro}</p>
      </div>
      {user.role === "runner" && <RunnerView user={user} />}
      {user.role === "admin" && <AdminTotals />}
      {user.role !== "runner" && <OrganizerView user={user} />}
    </div>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

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
  const others = upcoming.filter((b) => b.id !== next?.id && b.status !== "rejected");

  return (
    <>
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
            <Notice tone="blue" icon={<UserRound className="size-5" aria-hidden />}>
              Add your mobile number and emergency contact so registering takes less time.{" "}
              <Link href="/profile" className="font-semibold underline">
                Complete your profile
              </Link>
            </Notice>
          )}
        </div>
      )}

      <section aria-labelledby="next-race">
        <h2 id="next-race" className="sr-only">
          Your next race
        </h2>
        {next ? (
          <div className="grid gap-6 rounded-lg bg-card p-6 ring-1 ring-border md:grid-cols-[1fr_auto] md:p-8">
            <div className="grid content-start gap-3">
              <p className="font-display text-xl font-bold text-primary">{countdown(next.eventDate)}</p>
              <p className="font-display text-4xl leading-none font-extrabold tracking-tight md:text-5xl">{next.title}</p>
              <p className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
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
              <Link href={`/bookings#booking-${next.id}`} className="justify-self-start text-sm font-semibold text-primary hover:underline">
                See booking details
              </Link>
            </div>
            {next.status === "approved" && next.bibNumber !== null ? (
              <MiniBib number={next.bibNumber} attended={next.attended} className="md:justify-self-end" />
            ) : (
              <div className="grid h-36 w-44 -rotate-2 place-items-center self-start rounded-md border-2 border-dashed border-border p-4 text-center text-sm font-medium text-muted-foreground md:justify-self-end">
                Bib pending review
              </div>
            )}
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
          <h2 className="font-display text-2xl font-bold">Also coming up</h2>
          <ul className="divide-y rounded-lg bg-card ring-1 ring-border">
            {others.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <Link href={`/bookings#booking-${b.id}`} className="font-semibold hover:underline">
                    {b.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(b.eventDate, "short")} · {b.distanceLabel}
                  </p>
                </div>
                <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", b.status === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900")}>
                  {b.status === "approved" ? `Bib ${String(b.bibNumber).padStart(4, "0")}` : "Payment under review"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {openRaces.length > 0 && (
        <section className="grid gap-3">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-bold">Open for registration</h2>
            <Link href="/races" className="text-sm font-semibold text-primary hover:underline">
              All races
            </Link>
          </div>
          <ul className="grid gap-3 md:grid-cols-3">
            {openRaces.map((r) => (
              <li key={r.id}>
                <Link href={`/races?event=${r.id}`} className="grid h-full gap-1 rounded-lg bg-card p-5 ring-1 ring-border transition-colors hover:ring-primary">
                  <span className="text-sm text-muted-foreground">{formatDate(r.eventDate, "short")}</span>
                  <span className="font-display text-xl leading-tight font-bold">{r.title}</span>
                  <span className="text-sm text-muted-foreground">{r.location}</span>
                  {r.priceFrom > 0 && <span className="mt-2 text-sm font-semibold">From {formatPeso(r.priceFrom)}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

async function OrganizerView({ user }: { user: CurrentUser }) {
  const { races, totals } = await getOrganizerDashboard(user);
  const firstPending = races.find((r) => r.pending > 0);

  return (
    <>
      {user.role === "organizer" && (
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat
            label="Payments to review"
            value={totals.pending}
            tone={totals.pending > 0 ? "amber" : undefined}
            href={firstPending ? `/organizer/events/${firstPending.id}/registrations?status=pending` : undefined}
          />
          <Stat label="Confirmed runners" value={totals.approved} href="#fees" />
          <Stat label="Fees confirmed" value={formatPeso(totals.collected)} href="#fees" />
          <Stat label="Races open" value={totals.open} />
        </dl>
      )}

      <section className="grid gap-3">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold">{user.role === "admin" ? "Upcoming races" : "Your upcoming races"}</h2>
          <Link href="/organizer" className="text-sm font-semibold text-primary hover:underline">
            Manage events
          </Link>
        </div>
        {races.length === 0 ? (
          <div className="rounded-lg bg-card p-10 text-center ring-1 ring-border">
            <p className="font-display text-2xl font-bold">No upcoming races</p>
            <p className="mt-2 text-muted-foreground">Post a race and runners can start registering.</p>
            <Link href="/organizer/events/new" className={buttonVariants({ size: "lg", className: "mt-5" })}>
              Create a race
            </Link>
          </div>
        ) : (
          <ul className="divide-y rounded-lg bg-card ring-1 ring-border">
            {races.map((r) => {
              const filled = r.approved + r.pending;
              const pct = r.capacity ? Math.min(100, Math.round((filled / r.capacity) * 100)) : null;
              return (
                <li key={r.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_14rem_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/organizer/events/${r.id}/registrations`} className="font-semibold hover:underline">
                        {r.title}
                      </Link>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(r.eventDate, "short")} · {countdown(r.eventDate)}
                    </p>
                  </div>
                  <div className="grid gap-1.5">
                    <p className="text-sm">
                      <span className="font-semibold tabular-nums">{r.approved}</span> confirmed
                      {r.capacity ? <span className="text-muted-foreground"> of {r.capacity} slots</span> : null}
                    </p>
                    {pct !== null && (
                      <div
                        className="h-1.5 overflow-hidden rounded-full bg-muted"
                        role="meter"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={pct}
                        aria-label={`${r.title} is ${pct}% full`}
                      >
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 md:justify-end">
                    {r.pending > 0 && (
                      <Link
                        href={`/organizer/events/${r.id}/registrations?status=pending`}
                        className="rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900 hover:underline"
                      >
                        {r.pending} to review
                      </Link>
                    )}
                    <Link href={`/organizer/events/${r.id}/registrations`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      Registrations
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {races.length > 0 && <FeesSection races={races} totals={totals} />}
    </>
  );
}

type OrganizerData = Awaited<ReturnType<typeof getOrganizerDashboard>>;

// breakdown ng confirmed runners at fees kada race
function FeesSection({ races, totals }: OrganizerData) {
  return (
    <section id="fees" aria-labelledby="fees-title" className="grid scroll-mt-6 gap-3">
      <div>
        <h2 id="fees-title" className="font-display text-2xl font-bold">
          Confirmed runners and fees
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          A runner counts once you approve their receipt. Fees confirmed adds up the entry fee of each approved runner&apos;s
          distance. Runners pay outside RaceLink, so this is what their receipts show, not money RaceLink holds.
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg bg-card ring-1 ring-border">
        <table className="w-full min-w-[34rem] text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium">Race</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Confirmed runners</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Waiting for review</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Fees confirmed</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {races.map((r) => (
              <tr key={r.id}>
                <th scope="row" className="px-5 py-3 text-left font-normal">
                  <Link href={`/organizer/events/${r.id}/registrations?status=approved`} className="font-semibold hover:underline">
                    {r.title}
                  </Link>
                  <span className="block text-muted-foreground">{formatDate(r.eventDate, "short")}</span>
                </th>
                <td className="px-5 py-3 text-right tabular-nums">{r.approved}</td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {r.pending > 0 ? (
                    <Link href={`/organizer/events/${r.id}/registrations?status=pending`} className="font-semibold text-amber-800 hover:underline">
                      {r.pending}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right font-semibold tabular-nums">{formatPeso(r.collected)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t bg-muted/40 font-semibold">
            <tr>
              <th scope="row" className="px-5 py-3 text-left">Total</th>
              <td className="px-5 py-3 text-right tabular-nums">{totals.approved}</td>
              <td className="px-5 py-3 text-right tabular-nums">{totals.pending}</td>
              <td className="px-5 py-3 text-right tabular-nums">{formatPeso(totals.collected)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

async function AdminTotals() {
  const t = await getAdminTotals();
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat
        label="Users"
        value={t.users}
        detail={`${plural(t.runners, "runner")}, ${plural(t.organizers, "organizer")}, ${plural(t.admins, "admin")}${t.banned ? `, ${t.banned} banned` : ""}`}
        href="/admin"
      />
      <Stat label="Payments to review" value={t.bookings.pending ?? 0} tone={t.bookings.pending ? "amber" : undefined} />
      <Stat label="Confirmed bookings" value={t.bookings.approved ?? 0} detail={`${t.bookings.rejected ?? 0} rejected, ${t.bookings.cancelled ?? 0} cancelled`} />
      <Stat label="Fees confirmed" value={formatPeso(t.revenue)} />
    </dl>
  );
}

function Stat({ label, value, detail, tone, href }: { label: string; value: ReactNode; detail?: string; tone?: "amber"; href?: string }) {
  return (
    <div
      className={cn(
        "relative rounded-lg bg-card p-4 ring-1 ring-border",
        tone === "amber" && "bg-amber-50 ring-amber-200",
        href && "transition-colors has-[a:hover]:ring-primary has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring",
      )}
    >
      <dt className="text-sm text-muted-foreground">
        {href ? (
          <Link href={href} className="outline-none after:absolute after:inset-0 after:content-['']">
            {label}
          </Link>
        ) : (
          label
        )}
      </dt>
      <dd className="font-display text-3xl font-extrabold tabular-nums">{value}</dd>
      {detail && <dd className="text-xs text-muted-foreground">{detail}</dd>}
    </div>
  );
}

function Notice({ tone, icon, children }: { tone: "red" | "blue"; icon: ReactNode; children: ReactNode }) {
  return (
    <p
      className={cn(
        "flex items-start gap-3 rounded-lg px-4 py-3 text-sm ring-1",
        tone === "red" ? "bg-red-50 text-red-900 ring-red-200" : "bg-primary/5 text-foreground ring-primary/20",
      )}
    >
      <span className="mt-px shrink-0">{icon}</span>
      <span>{children}</span>
    </p>
  );
}
