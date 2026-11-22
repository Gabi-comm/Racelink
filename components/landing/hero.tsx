import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { RunnerStage } from "./runner-stage";

export function Hero() {
  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden">
      {/* red corner glow, like the light-beam inspo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_60%_at_0%_0%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent)] dark:bg-[radial-gradient(55%_60%_at_0%_0%,color-mix(in_oklab,var(--primary)_28%,transparent),transparent)]"
      />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-10 md:grid-cols-[1fr_1.05fr]">
        <div className="max-w-xl">
          <p className="text-xs font-semibold tracking-[0.35em] text-primary uppercase">Metro Manila race registration</p>
          <h1 className="mt-4 font-display text-[clamp(2.6rem,6vw,4.5rem)] leading-[1.02] font-extrabold tracking-tight text-balance">
            Run the race. <span className="text-primary">We&apos;ll handle the rest.</span>
          </h1>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/login?tab=signup" scroll={false} className={buttonVariants({ size: "lg", className: "h-11 px-5 text-base" })}>
              Create a runner account <ArrowRight aria-hidden />
            </Link>
            <Link href="/request" className={buttonVariants({ variant: "outline", size: "lg", className: "h-11 px-5 text-base" })}>
              Request a race
            </Link>
          </div>
        </div>
        <RunnerStage />
      </div>
    </section>
  );
}
