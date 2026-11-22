import type { ReactNode } from "react";
import { Ban, CheckCircle2, CircleDashed, CircleDot, Clock3, XCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { EVENT_STATUS_LABEL, type EventStatus } from "@/lib/constants";

export type Tone = "neutral" | "success" | "warning" | "danger" | "brand";

const TONE: Record<Tone, string> = {
  neutral: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  brand: "text-primary",
};

// glyph + word, walang pill background
export function StatusMark({ tone, icon: Icon, children, className }: { tone: Tone; icon: LucideIcon; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap", TONE[tone], className)}>
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {children}
    </span>
  );
}

const EVENT: Record<EventStatus, { tone: Tone; icon: LucideIcon }> = {
  draft: { tone: "neutral", icon: CircleDashed },
  open: { tone: "success", icon: CircleDot },
  closed: { tone: "warning", icon: Clock3 },
  cancelled: { tone: "danger", icon: Ban },
};

export function StatusBadge({ status }: { status: EventStatus }) {
  const s = EVENT[status];
  return (
    <StatusMark tone={s.tone} icon={s.icon}>
      {EVENT_STATUS_LABEL[status]}
    </StatusMark>
  );
}

export type BookingStatus = "pending" | "approved" | "rejected" | "cancelled";

const BOOKING: Record<BookingStatus, { tone: Tone; icon: LucideIcon; label: string }> = {
  pending: { tone: "warning", icon: Clock3, label: "To review" },
  approved: { tone: "success", icon: CheckCircle2, label: "Confirmed" },
  rejected: { tone: "danger", icon: XCircle, label: "Rejected" },
  cancelled: { tone: "neutral", icon: Ban, label: "Cancelled" },
};

export function BookingStatusMark({ status, label }: { status: BookingStatus; label?: string }) {
  const s = BOOKING[status];
  return (
    <StatusMark tone={s.tone} icon={s.icon}>
      {label ?? s.label}
    </StatusMark>
  );
}
