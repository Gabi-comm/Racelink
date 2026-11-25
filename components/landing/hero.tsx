import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { RunnerStage } from "./runner-stage";

export function Hero() {
  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden">
      {/* corner glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_60%_at_0%_0%,color-mix(in_oklab,var(--link)_10%,transparent),transparent)] dark:bg-[radial-gradient(55%_60%_at_0%_0%,color-mix(in_oklab,var(--link)_18%,transparent),transparent)]"
      />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-10 md:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="inline-flex rounded-full bg-marking px-3 py-1 text-[0.7rem] font-bold tracking-[0.12em] text-marking-foreground uppercase">
            Your start line is here
          </p>
          <h1 className="mt-5 font-[family-name:var(--font-oswald)] text-[clamp(3.5rem,11vw,7.5rem)] leading-[0.88] font-bold tracking-tight uppercase">
            <span className="block">RaceLink</span>
            <span className="block text-transparent [-webkit-text-stroke:2px_var(--foreground)]">Marathon</span>
            <span className="block">Booking</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">Run the race. We&apos;ll handle the rest.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login?tab=signup" scroll={false} className={buttonVariants({ size: "lg", className: "h-12 px-6 text-base" })}>
              Create a runner account <ArrowRight aria-hidden />
            </Link>
            <Link href="/request" className={buttonVariants({ variant: "outline", size: "lg", className: "h-12 px-6 text-base" })}>
              Request a race
            </Link>
          </div>
        </div>
        <RunnerStage />
      </div>
    </section>
  );
}
