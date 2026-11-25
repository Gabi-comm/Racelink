"use client";

import { useEffect, useRef, useState, type CSSProperties, type ComponentType, type ReactNode } from "react";
import { MousePointer2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Shared pieces for the acted-out demos on the home page (How it works, Host a Race!).
// Scene timing uses the .demo-* classes in globals.css: base styles are the END state,
// keyframes animate from the start state, so reduced motion simply shows the result.

export const STEP_MS = 4600;

export type DemoStep = { title: string; body: string; view: string; scene: ComponentType };

// timing helper: t(1.2) -> starts at 1.2s into the scene
export const t = (at: number, extra?: Record<string, string | number>) => ({ "--at": `${at}s`, ...extra }) as CSSProperties;

export function Cursor({ path, at, len }: { path: [string, string][]; at: number; len: number }) {
  const [p0, p1, p2 = p1] = path;
  return (
    <MousePointer2
      className="demo-cursor absolute z-30 size-5 fill-foreground text-background drop-shadow"
      style={t(at, { "--len": `${len}s`, "--x0": p0[0], "--y0": p0[1], "--x1": p1[0], "--y1": p1[1], "--x2": p2[0], "--y2": p2[1] })}
    />
  );
}

export function Ripple({ at }: { at: number }) {
  return <span className="demo-ripple pointer-events-none absolute top-1/2 left-1/2 -mt-5 -ml-5 size-10 rounded-full bg-primary" style={t(at)} />;
}

// types text out, one character per step
export function Typed({ text, at, len = 0.8, wrap, className }: { text: string; at: number; len?: number; wrap?: boolean; className?: string }) {
  return (
    <span className={cn("demo-type", !wrap && "whitespace-nowrap", className)} style={t(at, { "--len": `${len}s`, "--n": text.length })}>
      {text}
    </span>
  );
}

export function Mark({
  tone,
  icon,
  children,
  className,
  style,
}: {
  tone: "success" | "warning" | "neutral";
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const color = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap", color, className)} style={style}>
      {icon}
      {children}
    </span>
  );
}

type PlayerProps = {
  id: string;
  eyebrow: string;
  title: ReactNode;
  steps: DemoStep[];
  action?: ReactNode;
  flip?: boolean; // window on the left
  className?: string;
};

export function DemoPlayer({ id, eyebrow, title, steps, action, flip, className }: PlayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [run, setRun] = useState(0); // bumps to remount (replay) the current scene
  const [playing, setPlaying] = useState(false);

  // autoplay only while on screen, and never for reduced motion
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setPlaying(e.isIntersecting);
        if (e.isIntersecting) setRun((r) => r + 1);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => setStep((s) => (s + 1) % steps.length), STEP_MS);
    return () => clearTimeout(timer);
  }, [playing, step, run, steps.length]);

  const go = (i: number) => {
    setStep(i);
    setRun((r) => r + 1);
  };
  const Scene = steps[step].scene;

  return (
    <section aria-labelledby={`${id}-title`} className={className}>
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.35em] text-link uppercase">{eyebrow}</p>
            <h2 id={`${id}-title`} className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              {title}
            </h2>
          </div>
          {action}
        </div>

        <div
          ref={ref}
          className={cn(
            "mt-10 grid items-start gap-8 lg:gap-12",
            flip ? "lg:grid-cols-[1fr_minmax(0,22rem)]" : "lg:grid-cols-[minmax(0,22rem)_1fr]",
          )}
        >
          <ol className={cn("grid gap-2", flip && "lg:order-2")}>
            {steps.map((s, i) => {
              const active = i === step;
              return (
                <li key={s.title}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "relative w-full overflow-hidden rounded-lg border px-4 py-3.5 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      active ? "border-border bg-card shadow-sm" : "border-transparent hover:bg-muted/60",
                    )}
                  >
                    <span className="flex items-baseline gap-3">
                      <span className={cn("text-xs font-bold tabular-nums", active ? "text-link" : "text-muted-foreground")}>0{i + 1}</span>
                      <span className={cn("font-display text-base font-bold", !active && "text-muted-foreground")}>{s.title}</span>
                    </span>
                    {active && <span className="mt-1 block pl-7 text-sm leading-relaxed text-muted-foreground">{s.body}</span>}
                    {active && (
                      <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-muted">
                        <span
                          key={`${step}-${run}`}
                          className={cn("block h-full bg-primary", playing && "demo-progress")}
                          style={{ "--len": `${STEP_MS}ms` } as CSSProperties}
                        />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>

          {/* mock app window that acts the step out */}
          <div aria-hidden className="overflow-hidden rounded-xl border bg-card shadow-[0_24px_60px_-30px_rgb(0_0_0/0.35)]">
            <div className="flex h-10 items-center gap-3 border-b px-4">
              <span className="size-2 rounded-full bg-primary" />
              <span className="text-xs font-semibold">RaceLink</span>
              <span className="truncate text-xs text-muted-foreground">{steps[step].view}</span>
            </div>
            <div key={`${step}-${run}`} className="relative h-[21rem] overflow-hidden p-5">
              <Scene />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
