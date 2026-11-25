import { ViewTransition } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// tabs backed by URL params (server-rendered, works without JS)
// pills: active tab is navy. underline: periwinkle line under the active tab
// the active marker is one shared element, so it glides to the new tab
export function FilterTabs({
  label,
  items,
  variant = "pills",
}: {
  label: string;
  items: { href: string; label: string; count?: number; active: boolean }[];
  variant?: "pills" | "underline";
}) {
  const name = `tabs-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const marker = (className: string) => (
    <ViewTransition name={name} share="tab-slide" default="none">
      <span aria-hidden className={className} />
    </ViewTransition>
  );
  const text = (t: (typeof items)[number]) => (
    <span className="relative flex items-center gap-1.5">
      {t.label}
      {t.count !== undefined && <span className="text-xs tabular-nums opacity-70">{t.count}</span>}
    </span>
  );

  if (variant === "underline") {
    return (
      <nav aria-label={label} className="flex flex-wrap gap-x-2 border-b">
        {items.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            scroll={false}
            transitionTypes={["tab-switch"]}
            aria-current={t.active ? "page" : undefined}
            className={cn(
              "relative -mb-px flex items-center px-5 py-3 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
              t.active && "text-foreground",
            )}
          >
            {text(t)}
            {t.active && marker("absolute inset-x-0 bottom-0 h-0.5 bg-brand-light")}
          </Link>
        ))}
      </nav>
    );
  }
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          scroll={false}
          transitionTypes={["tab-switch"]}
          aria-current={t.active ? "page" : undefined}
          className={cn(
            "relative isolate flex h-10 items-center rounded-xl border px-4 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
            t.active && "border-transparent text-white hover:bg-transparent hover:text-white dark:text-primary-foreground dark:hover:text-primary-foreground",
          )}
        >
          {t.active && marker("absolute -inset-px -z-10 rounded-xl bg-brand-deep dark:bg-primary")}
          {text(t)}
        </Link>
      ))}
    </nav>
  );
}
