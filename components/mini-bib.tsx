import { cn } from "@/lib/utils";

export function MiniBib({ number, className }: { number: number; className?: string }) {
  return (
    <div className={cn("relative w-44 -rotate-2 self-start justify-self-start rounded-md bg-background ring-1 ring-border", className)}>
      <div className="rounded-t-md bg-primary px-3 py-1.5 font-display text-sm font-semibold text-primary-foreground">Your bib</div>
      <p className="px-3 pt-2 font-display text-6xl leading-none font-extrabold tabular-nums tracking-tighter">
        {String(number).padStart(4, "0")}
      </p>
      <div className="mx-3 mt-2 mb-3 h-1 w-10 rounded-full bg-marking" aria-hidden />
    </div>
  );
}
