"use client";

import { useId, useState, useTransition } from "react";
import { Check, UserCheck, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { approveBooking, rejectBooking, setCheckIn } from "./actions";

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
