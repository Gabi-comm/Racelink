"use client";

import { useActionState, useEffect, useId, useState, useTransition } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/booking-form";
import { cancelBooking, requestRefund, resubmitPayment, type RefundFormState } from "./actions";

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
            Your slot goes back to other runners and your uploaded receipt is deleted.
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

// cancels a paid registration and sends the organizer a refund request
export function RefundRequestButton({
  bookingId,
  title,
  amount,
  email,
  phone,
  raceCancelled,
}: {
  bookingId: number;
  title: string;
  amount: string;
  email: string;
  phone: string;
  raceCancelled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<RefundFormState, FormData>(requestRefund.bind(null, bookingId), {});
  const [pending, startTransition] = useTransition();
  const formId = useId();

  useEffect(() => {
    if (state.ok) toast.success("Refund requested. The organizer will review it.");
  }, [state]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  }

  const fe = state.fieldErrors ?? {};
  return (
    <Dialog open={open && !state.ok} onOpenChange={setOpen}>
      <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setOpen(true)}>
        {raceCancelled ? "Request refund" : "Cancel & request refund"}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{raceCancelled ? `Request a refund for ${title}` : `Cancel ${title} and request a refund?`}</DialogTitle>
          <DialogDescription>
            {raceCancelled
              ? `The organizer reviews your request and sends back ${amount}.`
              : `Your registration is cancelled right away and your slot goes back to other runners. The organizer reviews your request and sends back ${amount}.`}
          </DialogDescription>
        </DialogHeader>
        <form id={formId} onSubmit={onSubmit} className="grid gap-3" noValidate>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Reason for the refund</span>
            <Textarea name="reason" maxLength={500} required placeholder="I got injured and can't run this race." aria-invalid={!!fe.reason || undefined} />
            {fe.reason && <span className="text-sm text-destructive">{fe.reason}</span>}
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Email</span>
            <Input name="email" type="email" defaultValue={email} maxLength={255} required aria-invalid={!!fe.email || undefined} />
            {fe.email && <span className="text-sm text-destructive">{fe.email}</span>}
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Mobile number</span>
            <Input name="phone" type="tel" inputMode="tel" defaultValue={phone} maxLength={20} required aria-invalid={!!fe.phone || undefined} />
            {fe.phone && <span className="text-sm text-destructive">{fe.phone}</span>}
          </label>
          {state.error && !state.fieldErrors && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>{raceCancelled ? "Not now" : "Keep registration"}</DialogClose>
          <Button type="submit" form={formId} variant="destructive" disabled={pending}>
            {pending ? "Sending…" : raceCancelled ? "Request refund" : "Cancel & request refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
