"use client";

import { useId, useRef, useState, useTransition } from "react";
import { Check, Pencil, UserCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { approveBooking, rejectBooking, setBib, setCheckIn } from "@/app/(app)/organizer/events/[id]/registrations/actions";

type Result = { ok: true; message: string } | { ok: false; error: string };

function useRun() {
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<Result>, after?: () => void) =>
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message);
      after?.();
    });
  return [pending, run] as const;
}

export function ReviewButtons({ bookingId, runnerName }: { bookingId: number; runnerName: string }) {
  const [pending, run] = useRun();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const noteId = useId();

  function reject() {
    setError(null);
    run(
      async () => {
        const res = await rejectBooking(bookingId, note);
        if (!res.ok) setError(res.error);
        return res;
      },
      () => {
        setOpen(false);
        setNote("");
      },
    );
  }

  return (
    <div className="flex justify-end gap-1">
      <Button size="sm" disabled={pending} onClick={() => run(() => approveBooking(bookingId))}>
        <Check aria-hidden /> Approve
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setOpen(true)}>
          <X aria-hidden /> Reject
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {runnerName}&apos;s payment?</DialogTitle>
            <DialogDescription>The runner sees your reason in My Bookings and can upload a new receipt.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <label htmlFor={noteId} className="text-sm font-medium">
              Reason
            </label>
            <Textarea
              id={noteId}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={255}
              placeholder="Amount is short by ₱50."
              aria-invalid={!!error || undefined}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Keep for later</DialogClose>
            <Button variant="destructive" disabled={pending} onClick={reject}>
              {pending ? "Rejecting…" : "Reject payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function CheckInButton({ bookingId, attended }: { bookingId: number; attended: boolean }) {
  const [pending, run] = useRun();
  return attended ? (
    <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setCheckIn(bookingId, false))}>
      Undo check-in
    </Button>
  ) : (
    <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => setCheckIn(bookingId, true))}>
      <UserCheck aria-hidden /> Check in
    </Button>
  );
}

// inline bib edit; bibs are auto-assigned on approve, organizer can change it
export function BibEditor({ bookingId, bib }: { bookingId: number; bib: number | null }) {
  const [pending, run] = useRun();
  const [editing, setEditing] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const label = bib !== null ? String(bib).padStart(4, "0") : "—";

  function save() {
    const value = input.current?.value.trim() ?? "";
    if (value === String(bib ?? "")) return setEditing(false);
    run(() => setBib(bookingId, Number(value)), () => setEditing(false));
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="group inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-display text-lg font-extrabold tabular-nums hover:bg-muted"
        aria-label={bib !== null ? `Bib ${label}, change bib number` : "Assign a bib number"}
      >
        {label}
        <Pencil className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
      </button>
    );
  }
  return (
    <form
      className="flex items-center justify-end gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <Input
        ref={input}
        autoFocus
        type="number"
        inputMode="numeric"
        min={1}
        max={99999}
        defaultValue={bib ?? ""}
        aria-label="Bib number"
        className="h-8 w-20 text-right tabular-nums"
        onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
      />
      <Button type="submit" size="icon-sm" disabled={pending} aria-label="Save bib">
        <Check aria-hidden />
      </Button>
      <Button type="button" size="icon-sm" variant="ghost" onClick={() => setEditing(false)} aria-label="Cancel">
        <X aria-hidden />
      </Button>
    </form>
  );
}
