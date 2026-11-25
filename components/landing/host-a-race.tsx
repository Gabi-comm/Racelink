"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CircleCheck, CircleDot, Clock, PencilLine, ShieldCheck, Users } from "lucide-react";
import { Cursor, DemoPlayer, Mark, Ripple, Typed, t, type DemoStep } from "./demo-kit";

export function HostARace() {
  return (
    <DemoPlayer
      id="host"
      eyebrow="For organizations"
      title={
        <>
          Host a <span className="text-link">Race!</span>
        </>
      }
      flip
      steps={STEPS}
      action={
        <Link
          href="/request"
          transitionTypes={["page-nav"]}
          className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-primary px-5 text-base font-semibold text-primary-foreground transition-colors outline-none hover:bg-primary-hover focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Send a request <ArrowRight className="size-4" aria-hidden />
        </Link>
      }
    />
  );
}

// layouts are fixed-height on purpose so the cursor coordinates line up

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-2">
      <p className="h-4 text-[11px] font-semibold text-muted-foreground">{label}</p>
      <div className="mt-0.5 flex h-8 items-center overflow-hidden rounded-md border bg-background px-2.5 text-xs">{children}</div>
    </div>
  );
}

function RequestScene() {
  return (
    <>
      <p className="demo-in h-5 text-sm font-bold">Request a race</p>
      <div className="mt-1">
        <FormField label="Organization">
          <Typed text="UE Caloocan Student Council" at={0.3} len={0.9} />
        </FormField>
        <FormField label="Race name">
          <Typed text="UE Warriors Fun Run" at={1.25} len={0.6} />
        </FormField>
        <FormField label="Preferred date">
          <Typed text="07 / 12 / 2027" at={1.9} len={0.35} />
        </FormField>
      </div>
      <span className="relative mt-4 inline-flex h-9 items-center overflow-hidden rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">
        Send request
        <Ripple at={2.95} />
      </span>
      <div className="demo-in absolute right-5 bottom-5 flex items-center gap-2 rounded-lg border bg-popover px-3 py-2 text-xs font-semibold shadow-md" style={t(3.2)}>
        <CircleCheck className="size-4 text-success" /> Request sent
      </div>
      <Cursor path={[["85%", "60px"], ["72px", "250px"]]} at={2.2} len={2.2} />
    </>
  );
}

function ReviewScene() {
  return (
    <>
      <p className="demo-in flex h-5 items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <ShieldCheck className="size-3.5" /> Organizer
      </p>
      <p className="demo-in mt-1 text-sm font-bold" style={t(0.05)}>
        Request forms
      </p>
      <div className="demo-in mt-3 rounded-lg border bg-background p-3.5" style={t(0.15)}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-link">UE Caloocan Student Council</p>
            <p className="truncate text-sm font-bold">UE Warriors Fun Run</p>
            <p className="truncate text-xs text-muted-foreground">Jul 12, 2027 · 500 runners · 3K, 5K</p>
          </div>
          <span className="relative h-5 w-20 shrink-0">
            <Mark tone="warning" icon={<Clock className="size-3.5" />} className="demo-out absolute right-0" style={t(2.75)}>
              Waiting
            </Mark>
            <Mark tone="success" icon={<CircleCheck className="size-3.5" />} className="demo-in absolute right-0" style={t(2.8)}>
              Approved
            </Mark>
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <span className="relative inline-flex h-8 items-center overflow-hidden rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground">
            Approve
            <Ripple at={1.25} />
          </span>
          <span className="inline-flex h-8 items-center rounded-md px-3 text-xs font-medium ring-1 ring-border ring-inset">Reject</span>
        </div>
      </div>
      <p className="demo-in mt-4 flex items-center gap-1.5 text-xs font-semibold" style={t(3)}>
        <PencilLine className="size-4 text-link" /> Draft race created
      </p>
      {/* confirm dialog: pops in, gets clicked, goes away */}
      <div className="demo-out absolute right-5 bottom-5 z-20 w-60" style={t(2.75)}>
        <div className="demo-pop rounded-lg border bg-popover p-3 shadow-lg" style={t(1.4)}>
          <p className="text-xs font-semibold">Approve this request?</p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">A draft race is created for you to finish.</p>
          <span className="relative mt-2.5 inline-flex h-8 items-center overflow-hidden rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground">
            Approve and create draft
            <Ripple at={2.55} />
          </span>
        </div>
      </div>
      <Cursor path={[["80%", "40px"], ["60px", "168px"], ["calc(100% - 175px)", "284px"]]} at={0.4} len={2.6} />
    </>
  );
}

const FEES = [
  ["3K", "₱300"],
  ["5K", "₱450"],
  ["10K", "₱600"],
];

function SetupScene() {
  return (
    <>
      <div className="demo-in flex h-5 items-center justify-between">
        <p className="text-sm font-bold">UE Warriors Fun Run</p>
        <span className="relative h-5 w-16">
          <Mark tone="neutral" icon={<CircleDot className="size-3.5" />} className="demo-out absolute right-0" style={t(2.45)}>
            Draft
          </Mark>
          <Mark tone="success" icon={<CircleCheck className="size-3.5" />} className="demo-in absolute right-0" style={t(2.5)}>
            Open
          </Mark>
        </span>
      </div>
      <p className="demo-in mt-3 h-4 text-[11px] font-semibold text-muted-foreground" style={t(0.15)}>
        Distances and fees
      </p>
      <div className="mt-2 grid gap-1.5">
        {FEES.map(([d, fee], i) => (
          <div key={d} className="demo-in flex h-9 items-center justify-between rounded-md border bg-background px-3 text-xs" style={t(0.4 + 0.4 * i)}>
            <span className="font-semibold">{d}</span>
            <span className="tabular-nums">{fee}</span>
          </div>
        ))}
      </div>
      <div className="demo-in mt-2 flex h-8 items-center gap-2 text-xs text-muted-foreground" style={t(1.6)}>
        Pay via <b className="text-foreground">GCash 0917 123 4567</b>
      </div>
      <span className="demo-in relative mt-4 inline-flex h-9 items-center overflow-hidden rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground" style={t(1.7)}>
        Open registration
        <Ripple at={2.3} />
      </span>
      <Cursor path={[["85%", "90px"], ["84px", "266px"]]} at={1.6} len={2.2} />
    </>
  );
}

const SIGNUPS = ["PA", "KF", "MD", "BL", "JV"];

function SignupScene() {
  return (
    <>
      <div className="demo-in flex h-5 items-center justify-between">
        <p className="text-sm font-bold">UE Warriors Fun Run</p>
        <Mark tone="success" icon={<CircleCheck className="size-3.5" />}>
          Open
        </Mark>
      </div>
      <div className="demo-in mt-4 rounded-lg border bg-background p-4" style={t(0.1)}>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Users className="size-3.5" /> Runners signed up
        </p>
        <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">
          <span className="demo-count" style={t(0.3, { "--to": 128, "--len": "2.6s" })} />
          <span className="text-base font-semibold text-muted-foreground"> / 500</span>
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div className="demo-fill h-full bg-primary" style={{ ...t(0.3, { "--len": "2.6s" }), width: "25.6%" } as CSSProperties} />
        </div>
      </div>
      <div className="mt-4 flex items-center">
        {SIGNUPS.map((n, i) => (
          <span
            key={n}
            className="demo-pop -ml-2 grid size-9 place-items-center rounded-full border-2 border-card bg-brand-deep text-[11px] font-bold text-white first:ml-0"
            style={t(0.6 + 0.35 * i)}
          >
            {n}
          </span>
        ))}
        <span className="demo-in ml-2 text-xs font-semibold text-muted-foreground" style={t(2.4)}>
          +123 more
        </span>
      </div>
      <div className="demo-in absolute right-5 bottom-5 flex items-center gap-2 rounded-lg border bg-popover px-3 py-2 text-xs font-semibold shadow-md" style={t(2.9)}>
        <CircleCheck className="size-4 text-success" /> New sign-up: Paolo Aquino
      </div>
    </>
  );
}

const STEPS: DemoStep[] = [
  { title: "Send a request", body: "Tell us your organization, the race you have in mind, and when and where.", view: "Request a race", scene: RequestScene },
  { title: "An organizer reviews it", body: "An organizer checks the details and approves it. A draft race is created.", view: "Organizer · Request Forms", scene: ReviewScene },
  { title: "The race gets set up", body: "Distances, fees and payment details are added, then registration opens.", view: "Manage Events · Edit race", scene: SetupScene },
  { title: "Runners sign up", body: "Runners register and pay on RaceLink while the organizer handles the rest.", view: "Dashboard", scene: SignupScene },
];
