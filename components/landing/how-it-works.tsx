"use client";

import { BadgeCheck, Check, CircleCheck, Clock, FileImage, MapPin, ShieldCheck, Upload } from "lucide-react";
import { Cursor, DemoPlayer, Mark, Ripple, t, type DemoStep } from "./demo-kit";

export function HowItWorks() {
  return (
    <DemoPlayer
      id="hiw"
      eyebrow="How it works"
      title={
        <>
          Four steps to the <span className="text-link">start line.</span>
        </>
      }
      steps={STEPS}
    />
  );
}

// layout below is fixed-height on purpose so the cursor coordinates line up
const RACES = [
  ["Caloocan City Run", "Feb 14 · Caloocan City", "₱500"],
  ["BGC Night Dash", "Apr 10 · Taguig City", "₱400"],
  ["Valenzuela Fun Run", "May 2 · Valenzuela City", "₱300"],
];

function PickScene() {
  return (
    <>
      <p className="demo-in h-5 text-sm font-bold">Open races</p>
      <div className="mt-3 grid gap-2">
        {RACES.map(([name, meta, fee], i) => (
          <div key={name} className="demo-in relative flex h-[3.25rem] items-center justify-between rounded-lg border bg-background px-3" style={t(0.1 * i)}>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <MapPin className="size-3" /> {meta}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">from {fee}</span>
            {i === 1 && (
              <>
                <Ripple at={1.15} />
                <span className="demo-pop pointer-events-none absolute inset-0 rounded-lg ring-2 ring-link" style={t(1.2)} />
              </>
            )}
          </div>
        ))}
      </div>
      <p className="demo-in mt-4 h-4 text-xs font-semibold text-muted-foreground" style={t(1.4)}>
        Distance
      </p>
      <div className="mt-2 flex gap-2">
        {["3K", "5K", "10K", "21K"].map((d, i) => (
          <span key={d} className="demo-in relative grid h-8 w-14 place-items-center rounded-md border bg-background text-xs font-semibold" style={t(1.5 + 0.08 * i)}>
            {d}
            {d === "10K" && (
              <>
                <Ripple at={2.55} />
                <span className="demo-pop absolute inset-0 grid place-items-center rounded-md bg-primary text-primary-foreground" style={t(2.6)}>
                  10K
                </span>
              </>
            )}
          </span>
        ))}
      </div>
      <p className="demo-in mt-4 flex items-center gap-1.5 text-xs font-semibold text-success" style={t(2.9)}>
        <Check className="size-3.5" /> BGC Night Dash, 10K selected
      </p>
      <Cursor path={[["85%", "300px"], ["55%", "134px"], ["172px", "277px"]]} at={0.3} len={2.7} />
    </>
  );
}

function PayScene() {
  return (
    <>
      <p className="demo-in h-5 text-sm font-bold">BGC Night Dash · 10K</p>
      <p className="demo-in mt-1 text-xs text-muted-foreground" style={t(0.1)}>
        Send <b className="text-foreground">₱650</b> to GCash 0917 123 4567, then upload the receipt.
      </p>
      <div className="demo-in relative mt-4 grid h-32 place-items-center rounded-lg border-2 border-dashed bg-background" style={t(0.2)}>
        <span className="demo-out flex items-center gap-2 text-xs text-muted-foreground" style={t(1.1)}>
          <Upload className="size-4" /> Drop your receipt here
        </span>
        <div className="demo-drop absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-md border bg-card p-3 shadow-sm" style={t(0.5)}>
          <div className="flex items-center gap-2.5">
            <FileImage className="size-5 text-link" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">gcash-receipt.jpg</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="demo-fill h-full bg-primary" style={t(1.25, { "--len": "1.1s" })} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="demo-in mt-3 flex h-5 items-center gap-1.5 text-xs font-semibold text-success" style={t(2.4)}>
        <CircleCheck className="size-3.5" /> Receipt uploaded
      </p>
      <span className="demo-in relative mt-4 inline-flex h-9 items-center overflow-hidden rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground" style={t(2.5)}>
        Send for review
        <Ripple at={3.1} />
      </span>
      <Cursor path={[["90%", "300px"], ["84px", "266px"]]} at={2.6} len={1.4} />
    </>
  );
}

function ApproveScene() {
  return (
    <>
      <p className="demo-in flex h-5 items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <ShieldCheck className="size-3.5" /> Organizer
      </p>
      <p className="demo-in mt-1 text-sm font-bold" style={t(0.05)}>
        Payments to review
      </p>
      <div className="demo-in mt-3 rounded-lg border bg-background p-3.5" style={t(0.15)}>
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-deep text-xs font-bold text-white">EA</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Enzo Azuelo</p>
            <p className="truncate text-xs text-muted-foreground">BGC Night Dash · 10K · ₱650 · Ref GC-1042</p>
          </div>
          <span className="relative h-5 w-24 shrink-0">
            <Mark tone="warning" icon={<Clock className="size-3.5" />} className="demo-out absolute right-0" style={t(1.75)}>
              To review
            </Mark>
            <Mark tone="success" icon={<CircleCheck className="size-3.5" />} className="demo-in absolute right-0" style={t(1.8)}>
              Confirmed
            </Mark>
          </span>
        </div>
        <div className="mt-3 flex gap-2 pl-12">
          <span className="relative inline-flex h-8 items-center gap-1 overflow-hidden rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground">
            <Check className="size-3.5" /> Approve
            <Ripple at={1.6} />
          </span>
          <span className="inline-flex h-8 items-center rounded-md px-3 text-xs font-medium ring-1 ring-border ring-inset">Reject</span>
        </div>
      </div>
      <p className="demo-in mt-4 flex items-center gap-1.5 text-xs font-semibold" style={t(2.2)}>
        <BadgeCheck className="size-4 text-link" /> Bib <span className="tabular-nums">#1042</span> assigned automatically
      </p>
      <div className="demo-in absolute right-5 bottom-5 flex items-center gap-2 rounded-lg border bg-popover px-3 py-2 text-xs font-semibold shadow-md" style={t(2.5)}>
        <CircleCheck className="size-4 text-success" /> Payment approved
      </div>
      <Cursor path={[["80%", "40px"], ["104px", "150px"]]} at={0.6} len={3} />
    </>
  );
}

function BibScene() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8">
      <div className="relative">
        <div className="demo-pop w-64 overflow-hidden rounded-lg border bg-white text-[#172340] shadow-lg" style={t(0.2)}>
          <div className="bg-brand-deep px-4 py-2 text-[0.65rem] font-bold tracking-[0.2em] text-white uppercase">BGC Night Dash · Apr 10</div>
          <p className="demo-in px-4 pt-3 font-display text-6xl leading-none font-extrabold tracking-tight tabular-nums" style={t(0.6)}>
            1042
          </p>
          <div className="flex items-center justify-between px-4 pt-3 pb-4 text-xs font-semibold">
            <span>10K · Shirt M</span>
            <span className="h-1.5 w-10 rounded-full bg-marking" />
          </div>
        </div>
        <span
          className="demo-pop absolute -right-6 -bottom-5 rotate-[-10deg] rounded-md border-2 border-success bg-card px-2.5 py-1 text-xs font-extrabold tracking-wider text-success uppercase"
          style={t(2.2)}
        >
          Checked in
        </span>
      </div>
      <p className="demo-in flex items-center gap-1.5 text-xs font-semibold text-success" style={t(1.3)}>
        <CircleCheck className="size-3.5" /> Confirmed. See you on race day!
      </p>
    </div>
  );
}

const STEPS: DemoStep[] = [
  { title: "Pick a race", body: "Browse open races, pick one and choose your distance.", view: "Races", scene: PickScene },
  { title: "Pay and upload", body: "Send the entry fee by GCash or bank transfer, then upload the receipt.", view: "Register · Payment", scene: PayScene },
  {
    title: "Get confirmed",
    body: "An organizer checks your receipt and approves it. Your bib number is assigned.",
    view: "Organizer · Manage Participants",
    scene: ApproveScene,
  },
  { title: "Claim your bib", body: "Your bib shows up in My Bookings once you're confirmed.", view: "My Bookings", scene: BibScene },
];
