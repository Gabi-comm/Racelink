"use client";

import { useId, useRef, useState, useTransition } from "react";
import { Check, CheckCircle2, Pencil, Undo2, X } from "lucide-react";
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
import { ReceiptPreview } from "@/components/receipt-preview";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusMark } from "@/components/status-badge";
import { formatPeso } from "@/lib/events";
import { approveBooking, rejectBooking, processRefund, setBib, undoApproval } from "@/app/(app)/organizer/events/[id]/registrations/actions";

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
    <div className="flex justify-end gap-2">
      <Button size="sm" disabled={pending} className="h-9 px-3.5" onClick={() => run(() => approveBooking(bookingId))}>
        <Check aria-hidden /> Approve
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          className="h-9 border-destructive/25 bg-destructive/10 px-3.5 text-destructive hover:bg-destructive/15 hover:text-destructive"
          onClick={() => setOpen(true)}
        >
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

// undo an accidental approve; runner goes back to To review
export function UndoConfirmButton({ bookingId, runnerName, bib }: { bookingId: number; runnerName: string; bib: number | null }) {
  const [pending, run] = useRun();
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" disabled={pending} className="h-9 px-3.5" onClick={() => setOpen(true)}>
        <Undo2 aria-hidden /> Undo confirm
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move {runnerName} back to To review?</DialogTitle>
          <DialogDescription>
            {bib !== null ? `Bib ${String(bib).padStart(4, "0")} is released and ` : ""}
            {bib !== null ? "the" : "The"} receipt goes back to review, so you can approve or reject it again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Keep confirmed</DialogClose>
          <Button variant="destructive" disabled={pending} onClick={() => run(() => undoApproval(bookingId), () => setOpen(false))}>
            {pending ? "Undoing…" : "Undo confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

type RefundInfo = {
  id: number;
  reason: string;
  email: string;
  phone: string;
  amount: number;
  status: "requested" | "processed";
  createdAt: Date;
  processedAt: Date | null;
};

const stamp = (d: Date) =>
  new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(d);

// refund column on the Cancelled tab: nothing, Review Refund (opens the runner's request), or Refund Processed
export function RefundStatus({ refund, runnerName, receiptId }: { refund: RefundInfo | null; runnerName: string; receiptId?: number }) {
  const [pending, run] = useRun();
  const [open, setOpen] = useState(false);

  if (!refund) return <span className="text-xs text-muted-foreground">No refund requested</span>;
  if (refund.status === "processed") {
    return (
      <div>
        <StatusMark tone="success" icon={CheckCircle2}>
          Refund Processed
        </StatusMark>
        {refund.processedAt && <p className="mt-0.5 text-xs text-muted-foreground">{stamp(refund.processedAt)}</p>}
      </div>
    );
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}>
        Review Refund
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{runnerName}&apos;s refund request</DialogTitle>
          <DialogDescription>Sent {stamp(refund.createdAt)}. Send the refund, then mark it as processed.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Reason</p>
            <p className="mt-1 text-sm whitespace-pre-line">{refund.reason}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Amount to refund</dt>
              <dd className="mt-0.5 font-display text-lg font-bold tabular-nums">{formatPeso(refund.amount)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Receipt</dt>
              <dd className="mt-1">
                {receiptId ? (
                  <ReceiptPreview receiptId={receiptId} className="font-medium text-link hover:underline" />
                ) : (
                  <span className="text-muted-foreground">No receipt</span>
                )}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-medium text-muted-foreground">Email</dt>
              <dd className="mt-0.5 break-all">
                <a href={`mailto:${refund.email}`} className="hover:underline">
                  {refund.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Mobile number</dt>
              <dd className="mt-0.5 tabular-nums">
                <a href={`tel:${refund.phone.replace(/\s/g, "")}`} className="hover:underline">
                  {refund.phone}
                </a>
              </dd>
            </div>
          </dl>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
          <Button disabled={pending} onClick={() => run(() => processRefund(refund.id), () => setOpen(false))}>
            <Check aria-hidden /> {pending ? "Processing…" : "Process"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
