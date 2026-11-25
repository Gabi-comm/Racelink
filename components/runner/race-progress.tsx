import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "pending" | "approved" | "rejected" | "cancelled";

const STEPS = ["Registered", "Payment review", "Confirmed"] as const;

// where a booking is on its way to race day
export function RaceProgress({ status, className }: { status: Status; className?: string }) {
  if (status === "cancelled") return null;
  // index of the step currently in progress / last reached
  const reached = status === "pending" ? 1 : status === "rejected" ? 1 : 2;

  return (
    <ol className={cn("grid grid-cols-3 gap-1", className)} aria-label="Registration progress">
      {STEPS.map((label, i) => {
        const done = i < reached || (i === reached && status === "approved");
        const failed = status === "rejected" && i === 1;
        const current = i === reached && !done && !failed;
        return (
          <li key={label} className="grid gap-1.5" aria-current={current ? "step" : undefined}>
            <span
              className={cn(
                "h-1 rounded-full bg-border",
                done && "bg-primary",
                current && "bg-primary/40",
                failed && "bg-destructive",
              )}
              aria-hidden
            />
            <span
              className={cn(
                "flex items-center gap-1 text-[0.7rem] leading-tight font-medium text-muted-foreground sm:text-xs",
                (done || current) && "text-foreground",
                failed && "text-destructive",
              )}
            >
              {done && <Check className="size-3 shrink-0 text-link" aria-hidden />}
              {failed && <X className="size-3 shrink-0" aria-hidden />}
              {failed ? "Payment rejected" : label}
              <span className="sr-only">{done ? " (done)" : current ? " (in progress)" : failed ? "" : " (not yet)"}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
