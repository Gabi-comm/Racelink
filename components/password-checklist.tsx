"use client";

import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PASSWORD_RULES } from "@/lib/password";

// live list under a new-password field; each rule ticks off as it's met
export function PasswordChecklist({ value, id, className }: { value: string; id?: string; className?: string }) {
  return (
    <ul id={id} className={cn("grid gap-1 text-sm", className)} aria-label="Password requirements">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(value);
        return (
          <li key={r.id} className={cn("flex items-center gap-1.5 transition-colors", ok ? "text-success" : "text-muted-foreground")}>
            {ok ? <Check className="size-3.5 shrink-0" aria-hidden /> : <Circle className="size-3 shrink-0" aria-hidden />}
            {r.label}
            <span className="sr-only">{ok ? " (met)" : " (not met yet)"}</span>
          </li>
        );
      })}
    </ul>
  );
}
