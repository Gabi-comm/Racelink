import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-2xl font-extrabold leading-none tracking-tight", className)}>
      Race<span className="text-primary">Link</span>
    </span>
  );
}
