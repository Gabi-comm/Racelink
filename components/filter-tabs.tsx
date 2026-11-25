import Link from "next/link";
import { cn } from "@/lib/utils";

// tabs backed by URL params (server-rendered, works without JS)
// pills: active tab is navy. underline: periwinkle line under the active tab
export function FilterTabs({
  label,
  items,
  variant = "pills",
}: {
  label: string;
  items: { href: string; label: string; count?: number; active: boolean }[];
  variant?: "pills" | "underline";
}) {
  if (variant === "underline") {
    return (
      <nav aria-label={label} className="flex flex-wrap gap-x-2 border-b">
        {items.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={t.active ? "page" : undefined}
            className={cn(
              "-mb-px flex items-center gap-1.5 border-b-2 border-transparent px-5 py-3 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
              t.active && "border-brand-light text-foreground",
            )}
          >
            {t.label}
            {t.count !== undefined && <span className="text-xs tabular-nums opacity-70">{t.count}</span>}
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
          aria-current={t.active ? "page" : undefined}
          className={cn(
            "flex h-10 items-center gap-1.5 rounded-xl border px-4 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
            t.active && "border-brand-deep bg-brand-deep text-white hover:bg-brand-deep hover:text-white dark:border-primary dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground",
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="text-xs tabular-nums opacity-70">{t.count}</span>}
        </Link>
      ))}
    </nav>
  );
}
