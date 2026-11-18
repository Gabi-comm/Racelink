"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { deleteEvent } from "./actions";

type Props = { id: number; title: string; hasBookings: boolean; redirectTo?: string };

export function DeleteEventButton({ id, title, hasBookings, redirectTo }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function confirm() {
    setError("");
    startTransition(async () => {
      const res = await deleteEvent(id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      toast.success(`Deleted ${title}.`);
      if (redirectTo) router.push(redirectTo);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setError(""); }}>
      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setOpen(true)}>
        Delete
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {title}?</DialogTitle>
          <DialogDescription>
            {hasBookings
              ? "This race already has bookings, so it can't be deleted. Set its status to Cancelled instead so runners can still see what happened."
              : "The race, its distances and its files will be removed. This can't be undone."}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Keep race</DialogClose>
          {!hasBookings && (
            <Button variant="destructive" disabled={pending} onClick={confirm}>
              {pending ? "Deleting…" : "Delete race"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
