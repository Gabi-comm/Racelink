"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

// palette: single series = racing red #d40000; the only 2-series chart adds #ff6e6e (validated pair, legend + table view)
const RED = "var(--chart-1)";
const RED_LIGHT = "#ff6e6e";

const peso = (n: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);
const pesoShort = (n: number) => (n >= 1000 ? `₱${Math.round(n / 100) / 10}k` : `₱${n}`);
const shortDate = (d: string) =>
  new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));
const monthName = (m: string) =>
  new Intl.DateTimeFormat("en-PH", { month: "short", timeZone: "UTC" }).format(new Date(`${m}-01T00:00:00Z`));

const axis = { tickLine: false, axisLine: false, tickMargin: 8, fontSize: 12 } as const;

export function WeeklyRegistrationsChart({ data }: { data: { week: string; registrations: number }[] }) {
  const config = { registrations: { label: "Sign-ups", color: RED } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <AreaChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fill-reg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-registrations)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--color-registrations)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="week" {...axis} tickFormatter={shortDate} interval="preserveStartEnd" minTickGap={24} />
        <YAxis {...axis} allowDecimals={false} width={40} />
        <ChartTooltip
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          content={<ChartTooltipContent labelFormatter={(v) => `Week of ${shortDate(String(v))}`} />}
        />
        <Area
          dataKey="registrations"
          type="monotone"
          stroke="var(--color-registrations)"
          strokeWidth={2}
          fill="url(#fill-reg)"
          activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function RaceFillChart({ data }: { data: { title: string; confirmed: number; pending: number }[] }) {
  const config = {
    confirmed: { label: "Confirmed", color: RED },
    pending: { label: "Waiting for review", color: RED_LIGHT },
  } satisfies ChartConfig;
  const height = Math.max(160, data.length * 44 + 56);
  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }} barCategoryGap={10}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" {...axis} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="title"
          {...axis}
          width={150}
          tickFormatter={(t: string) => (t.length > 20 ? `${t.slice(0, 19)}…` : t)}
        />
        <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.6 }} content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} verticalAlign="top" />
        <Bar dataKey="confirmed" stackId="r" fill="var(--color-confirmed)" stroke="var(--card)" strokeWidth={2} maxBarSize={20} />
        <Bar
          dataKey="pending"
          stackId="r"
          fill="var(--color-pending)"
          stroke="var(--card)"
          strokeWidth={2}
          radius={[0, 4, 4, 0]}
          maxBarSize={20}
        />
      </BarChart>
    </ChartContainer>
  );
}

export function FeesByMonthChart({ data }: { data: { month: string; fees: number }[] }) {
  const config = { fees: { label: "Fees confirmed", color: RED } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <BarChart data={data} margin={{ left: -4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="month" {...axis} tickFormatter={monthName} />
        <YAxis {...axis} width={48} tickFormatter={pesoShort} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.6 }}
          content={
            <ChartTooltipContent
              labelFormatter={(v) => monthName(String(v))}
              formatter={(value) => (
                <span className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">Fees confirmed</span>
                  <span className="font-mono font-medium tabular-nums">{peso(Number(value))}</span>
                </span>
              )}
            />
          }
        />
        <Bar dataKey="fees" fill="var(--color-fees)" radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ChartContainer>
  );
}

// part-to-whole as ranked horizontal bars, one hue
export function RankedBars({ data, label }: { data: { label: string; runners: number }[]; label: string }) {
  const config = { runners: { label, color: RED } } satisfies ChartConfig;
  const height = Math.max(120, data.length * 34 + 16);
  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 32 }} barCategoryGap={8}>
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis type="category" dataKey="label" {...axis} width={72} />
        <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.6 }} content={<ChartTooltipContent hideIndicator />} />
        <Bar
          dataKey="runners"
          fill="var(--color-runners)"
          radius={[0, 4, 4, 0]}
          maxBarSize={18}
          label={{ position: "right", fill: "var(--muted-foreground)", fontSize: 12 }}
        />
      </BarChart>
    </ChartContainer>
  );
}
