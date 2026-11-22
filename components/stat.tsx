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
  return (
    <div
      className={cn(
        "relative rounded-lg bg-card p-4 ring-1 ring-border",
        attention && "shadow-[inset_3px_0_0_var(--primary)]",
        href && "transition-colors has-[a:hover]:ring-primary/60 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring",
        className,
      )}
    >
      <dt className="text-sm text-muted-foreground">
        {href ? (
          <Link href={href} className="outline-none after:absolute after:inset-0 after:content-['']">
            {label}
          </Link>
        ) : (
          label
        )}
      </dt>
      <dd className="mt-1 font-display text-3xl font-extrabold tracking-tight tabular-nums">
        {value}
        {suffix && <span className="ml-1 text-base font-bold text-muted-foreground">{suffix}</span>}
      </dd>
      {detail && <dd className="mt-0.5 text-xs text-muted-foreground">{detail}</dd>}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
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
