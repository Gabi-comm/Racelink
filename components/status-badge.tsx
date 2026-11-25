import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { EVENT_STATUS_LABEL, type EventStatus } from "@/lib/constants";

export type Tone = "neutral" | "success" | "warning" | "danger" | "brand";

const TONE: Record<Tone, string> = {
  neutral: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  brand: "text-link",
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

const PILL = "inline-flex items-center rounded-full px-3 py-1 text-[0.7rem] font-bold tracking-[0.12em] whitespace-nowrap uppercase";

const EVENT_PILL: Record<EventStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  open: "bg-marking text-marking-foreground",
  closed: "bg-brand-light/20 text-link",
  cancelled: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ status }: { status: EventStatus }) {
  return <span className={cn(PILL, EVENT_PILL[status])}>{EVENT_STATUS_LABEL[status]}</span>;
}

export type BookingStatus = "pending" | "approved" | "rejected" | "cancelled";

const BOOKING_LABEL: Record<BookingStatus, string> = {
  pending: "To review",
  approved: "Confirmed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

// pill per status: review periwinkle, confirmed lime, rejected red, cancelled gray
const BOOKING_PILL: Record<BookingStatus, string> = {
  pending: "bg-brand-light/20 text-link",
  approved: "bg-marking text-marking-foreground",
  rejected: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

export function BookingStatusMark({ status, label }: { status: BookingStatus; label?: string }) {
  return <span className={cn(PILL, BOOKING_PILL[status])}>{label ?? BOOKING_LABEL[status]}</span>;
}
