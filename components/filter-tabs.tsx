import Link from "next/link";
import { cn } from "@/lib/utils";

// underline tabs backed by URL params (server-rendered, works without JS)
export function FilterTabs({
  label,
  items,
}: {
  label: string;
  items: { href: string; label: string; count?: number; active: boolean }[];
}) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-x-1 border-b">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={cn(
            "-mb-px flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
            t.active && "border-primary text-foreground",
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="text-xs tabular-nums opacity-70">{t.count}</span>}
        </Link>
      ))}
    </nav>
  );
}
