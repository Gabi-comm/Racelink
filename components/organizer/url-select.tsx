"use client";

import { useId, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

// select that writes its value to a URL param (filters stay shareable)
export function UrlSelect({
  param,
  label,
  value,
  options,
  className,
  big,
}: {
  param: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  className?: string;
  // tall select, label for screen readers only
  big?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const id = useId();

  return (
    <div className={cn("grid gap-1", className)}>
      <label htmlFor={id} className={cn("text-xs font-medium text-muted-foreground", big && "sr-only")}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        aria-busy={pending || undefined}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          if (e.target.value) next.set(param, e.target.value);
          else next.delete(param);
          const s = next.toString();
          // same quick cross-fade as the filter tabs, and no jump to the top
          startTransition(() =>
            router.push(`${pathname}${s ? `?${s}` : ""}`, { scroll: false, transitionTypes: ["tab-switch"] }),
          );
        }}
        className={cn(
          "h-9 w-full min-w-0 rounded-lg border border-input bg-card px-2.5 text-sm transition-opacity duration-200 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-busy:opacity-70",
          big && "h-12 rounded-xl px-3.5 text-base",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
