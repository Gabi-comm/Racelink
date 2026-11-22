import { ViewTransition } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// underline tabs backed by URL params (server-rendered, works without JS).
// The red underline is a shared view transition, so it slides to the tab you pick.
export function FilterTabs({
  label,
  items,
}: {
  label: string;
  items: { href: string; label: string; count?: number; active: boolean }[];
}) {
  const indicator = `tabs-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <nav aria-label={label} className="flex flex-wrap gap-x-1 border-b">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={cn(
            "relative -mb-px flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
            t.active && "text-foreground",
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="text-xs tabular-nums opacity-70">{t.count}</span>}
          {t.active && (
            <ViewTransition name={indicator} share="tab-slide">
              <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
            </ViewTransition>
          )}
        </Link>
      ))}
    </nav>
  );
}
