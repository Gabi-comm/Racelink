"use client";

import { useId, useState } from "react";
import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PARTICIPANT_TABS, type ParticipantTab } from "@/lib/participant-filters";

const FORMATS = [
  { value: "csv", label: "CSV" },
  { value: "pdf", label: "PDF" },
] as const;
type Format = (typeof FORMATS)[number]["value"];

const selectClass =
  "h-9 min-w-0 rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

// pick which tab and which file type to export; starts on the tab being viewed (parent keys it by tab)
export function ExportMenu({ tab, eventId, counts }: { tab: ParticipantTab; eventId: number | null; counts: Record<ParticipantTab, number> }) {
  const [choice, setChoice] = useState<ParticipantTab>(tab);
  const [format, setFormat] = useState<Format>("csv");
  const id = useId();
  const params = new URLSearchParams({ status: choice, format });
  if (eventId !== null) params.set("event", String(eventId));
  const empty = counts[choice] === 0;

  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        Export
      </label>
      <div className="flex gap-2">
        <select id={id} value={choice} onChange={(e) => setChoice(e.target.value as ParticipantTab)} className={`${selectClass} flex-1 sm:w-44 sm:flex-none`}>
          {PARTICIPANT_TABS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label} ({counts[t.value]})
            </option>
          ))}
        </select>
        <select value={format} onChange={(e) => setFormat(e.target.value as Format)} aria-label="File type" className={`${selectClass} w-20`}>
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <a
          href={empty ? undefined : `/api/participants/export?${params}`}
          aria-disabled={empty || undefined}
          aria-label={`Download ${format.toUpperCase()}`}
          className={buttonVariants({ variant: "outline", size: "icon", className: "size-9 shrink-0 aria-disabled:pointer-events-none aria-disabled:opacity-50" })}
          download
        >
          <Download aria-hidden />
        </a>
      </div>
    </div>
  );
}
