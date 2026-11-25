import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// KPI tile; whole tile is clickable when href is set
export function Stat({
  label,
  value,
  detail,
  suffix,
  attention,
  href,
  className,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  suffix?: string;
  attention?: boolean;
  href?: string;
  className?: string;
}) {
  // 4 -> 04, gaya ng scoreboard
  const shown = typeof value === "number" && value >= 0 && value < 10 ? String(value).padStart(2, "0") : value;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-card p-5 pb-6 ring-1 ring-border",
        "after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:bg-brand-light/50",
        attention && "after:bg-marking",
        href && "transition-colors has-[a:hover]:ring-link/60 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring",
        className,
      )}
    >
      <dt className="text-xs font-semibold text-muted-foreground">
        {href ? (
          <Link href={href} className="outline-none after:absolute after:inset-0 after:content-['']">
            {label}
          </Link>
        ) : (
          label
        )}
      </dt>
      <dd className="mt-4 font-[family-name:var(--font-oswald)] text-4xl font-bold tracking-tight tabular-nums">
        {shown}
        {suffix && <span className="ml-1 text-base font-bold text-muted-foreground">{suffix}</span>}
      </dd>
      {detail && <dd className={cn("mt-2 text-xs text-muted-foreground", attention && "font-medium text-link")}>{detail}</dd>}
    </div>
  );
}

// table card: tinted header row, small caps labels, roomier rows
export const TABLE_SHELL =
  "overflow-x-auto rounded-2xl bg-card ring-1 ring-border [&_tbody_td]:py-4 [&_thead]:bg-muted/60 [&_thead_th]:h-12 [&_thead_th]:text-[0.7rem] [&_thead_th]:font-bold [&_thead_th]:tracking-[0.12em] [&_thead_th]:text-muted-foreground [&_thead_th]:uppercase";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <>
            <p className="text-xs font-semibold tracking-[0.2em] text-link uppercase">{eyebrow}</p>
            <h1 className="mt-2 font-[family-name:var(--font-oswald)] text-[clamp(2.5rem,5vw,3.75rem)] leading-none font-bold tracking-tight uppercase">
              {title}
            </h1>
          </>
        ) : (
          <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        )}
        {description && <p className="mt-1 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, action, children, className }: { title: string; description?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("grid content-start gap-4 rounded-lg bg-card p-5 ring-1 ring-border", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-bold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg bg-card p-10 text-center ring-1 ring-border">
      <p className="font-display text-xl font-bold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
