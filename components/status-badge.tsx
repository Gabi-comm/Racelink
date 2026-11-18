import { cn } from "@/lib/utils";
import { EVENT_STATUS_LABEL, type EventStatus } from "@/lib/constants";

const STYLE: Record<EventStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  open: "bg-emerald-100 text-emerald-800",
  closed: "bg-amber-100 text-amber-900",
  cancelled: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-semibold", STYLE[status])}>
      {EVENT_STATUS_LABEL[status]}
    </span>
  );
}
