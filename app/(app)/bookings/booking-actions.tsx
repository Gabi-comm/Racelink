"use client";

import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { ReceiptPicker } from "@/components/receipt-picker";
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
import type { FormState } from "@/lib/booking-form";
import { cancelBooking, resubmitPayment } from "./actions";

export function ResubmitForm({ bookingId }: { bookingId: number }) {
  const [state, formAction] = useActionState<FormState, FormData>(resubmitPayment.bind(null, bookingId), {});
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-lg p-4 ring-1 ring-border" noValidate>
      <p className="font-semibold">Send a new receipt</p>
      <label className="grid gap-1.5 sm:max-w-sm">
        <span className="text-sm font-medium">Reference number</span>
        <Input name="referenceNo" maxLength={100} />
      </label>
      <ReceiptPicker error={state.fieldErrors?.receiptKey} onBusyChange={setUploading} />
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" className="justify-self-start" disabled={pending || uploading}>
        {pending ? "Sending…" : "Send new receipt"}
      </Button>
    </form>
  );
}

export function CancelBookingButton({ bookingId, title }: { bookingId: number; title: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const res = await cancelBooking(bookingId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setOpen(false);
      toast.success("Registration cancelled.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setOpen(true)}>
        Cancel registration
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel your registration for {title}?</DialogTitle>
          <DialogDescription>
            Your slot goes back to other runners and your uploaded receipt is deleted. For refunds, contact the organizer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Keep registration</DialogClose>
          <Button variant="destructive" disabled={pending} onClick={confirm}>
            {pending ? "Cancelling…" : "Cancel registration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
