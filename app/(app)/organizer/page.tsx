import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { FeesByMonthChart, RaceFillChart, RankedBars, WeeklyRegistrationsChart } from "@/components/charts/organizer-charts";
import { EmptyState, PageHeader, Panel, Stat } from "@/components/stat";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatPeso } from "@/lib/events";
import { getOrganizerAnalytics, type OrganizerAnalytics } from "@/lib/queries/analytics";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

export default function OrganizerDashboardPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Dashboard"
        description="How your races are filling up, what needs your review, and the fees confirmed so far."
        actions={
          <Link href="/organizer/events/new" className={buttonVariants({ size: "lg", className: "h-10 px-4" })}>
            <Plus aria-hidden /> New race
          </Link>
        }
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </div>
  );
}

async function Dashboard() {
  const user = await requireUser("organizer");
  const data = await getOrganizerAnalytics(user);
  const { kpis } = data;
  const scope = user.role === "admin" ? "all races" : "your races";

  return (
    <>
      <dl className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Payments to review"
          value={kpis.pending}
          detail={kpis.pending > 0 ? `${formatPeso(kpis.pendingFees)} waiting` : "All caught up"}
          attention={kpis.pending > 0}
          href="/organizer/participants?status=pending"
        />
        <Stat label="Confirmed runners" value={kpis.confirmed} detail={`of ${kpis.registrations} sign-ups`} href="/organizer/participants?status=approved" />
        <Stat label="Fees confirmed" value={formatPeso(kpis.fees)} detail={`Across ${scope}`} />
        <Stat
          label="Race requests"
          value={kpis.pendingRequests}
          detail={kpis.pendingRequests > 0 ? "Waiting for a decision" : "No new requests"}
          attention={kpis.pendingRequests > 0}
          href="/organizer/requests"
        />
        <Stat label="Open for registration" value={kpis.racesOpen} detail={`${kpis.racesUpcoming} upcoming in total`} href="/organizer/events" />
        <Stat label="Finished races" value={kpis.racesFinished} href="/organizer/events?tab=previous" />
        <Stat
          label="Check-in rate"
          value={kpis.checkInRate === null ? "—" : `${kpis.checkInRate}%`}
          detail="Confirmed runners who showed up, past races"
        />
        <Stat label="Rejected payments" value={kpis.rejected} detail="Runners can send a new receipt" href="/organizer/participants?status=rejected" />
      </dl>

      <div className="stagger grid gap-4 lg:grid-cols-2">
        <Panel title="Sign-ups per week" description="New registrations, last 12 weeks">
          <WeeklyRegistrationsChart data={data.weekly} />
        </Panel>
        <Panel title="Fees confirmed per month" description="Approved entries by sign-up month, last 6 months">
          <FeesByMonthChart data={data.feesByMonth} />
        </Panel>
      </div>

      <UpcomingRaces races={data.upcoming} />

      <div className="grid gap-4 md:grid-cols-3">
        <Panel title="Distances" description="Confirmed and waiting runners">
          {data.distances.length ? <RankedBars data={data.distances} label="Runners" /> : <NoData />}
        </Panel>
        <Panel title="Shirt sizes to order" description="Confirmed runners, upcoming races">
          {data.sizes.length ? <RankedBars data={data.sizes} label="Shirts" /> : <NoData />}
        </Panel>
        <Panel title="Runners by gender" description="Confirmed runners, from their profiles">
          {data.genders.length ? <RankedBars data={data.genders} label="Runners" /> : <NoData />}
        </Panel>
      </div>
    </>
  );
}

function UpcomingRaces({ races }: { races: OrganizerAnalytics["upcoming"] }) {
  if (races.length === 0) {
    return (
      <EmptyState
        title="No upcoming races"
        text="Post a race, or approve a race request, and runners can start registering."
        action={
          <Link href="/organizer/events/new" className={buttonVariants({ size: "lg" })}>
            Create a race
          </Link>
        }
      />
    );
  }
  return (
    <Panel
      title="Upcoming races"
      description="Confirmed and waiting runners per race"
      action={
        <Link href="/organizer/events" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          Manage events <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      }
    >
      <RaceFillChart data={races} />
      {/* table view of the same numbers */}
      <div className="-mx-5 overflow-x-auto border-t">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th scope="col" className="px-5 py-2.5 font-medium">Race</th>
              <th scope="col" className="px-5 py-2.5 font-medium">Status</th>
              <th scope="col" className="px-5 py-2.5 text-right font-medium">Confirmed</th>
              <th scope="col" className="px-5 py-2.5 text-right font-medium">To review</th>
              <th scope="col" className="px-5 py-2.5 text-right font-medium">Slots filled</th>
            </tr>
          </thead>
          <tbody className="divide-y border-t">
            {races.map((r) => {
              const filled = r.confirmed + r.pending;
              return (
                <tr key={r.id}>
                  <th scope="row" className="px-5 py-2.5 text-left font-normal">
                    <Link href={`/organizer/participants?event=${r.id}`} className="font-semibold hover:underline">
                      {r.title}
                    </Link>
                    <span className="block text-xs text-muted-foreground">{formatDate(r.eventDate, "short")}</span>
                  </th>
                  <td className="px-5 py-2.5">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums">{r.confirmed}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums">
                    {r.pending > 0 ? (
                      <Link href={`/organizer/participants?event=${r.id}&status=pending`} className="font-semibold text-primary hover:underline">
                        {r.pending}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums">
                    {r.capacity ? `${Math.min(100, Math.round((filled / r.capacity) * 100))}% of ${r.capacity}` : <span className="text-muted-foreground">No cap</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function NoData() {
  return <p className="py-6 text-center text-sm text-muted-foreground">No runners yet.</p>;
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4" aria-hidden>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-24 rounded-lg bg-card ring-1 ring-border" />
        ))}
      </div>
      <div className="stagger grid gap-4 lg:grid-cols-2">
        <div className="h-72 rounded-lg bg-card ring-1 ring-border" />
        <div className="h-72 rounded-lg bg-card ring-1 ring-border" />
      </div>
    </div>
  );
}
