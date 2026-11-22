"use client";

import { useId, useState, useTransition } from "react";
import { Check, X } from "lucide-react";
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
import { approveRequest, rejectRequest } from "./actions";

export function RequestActions({ id, organization, raceTitle }: { id: number; organization: string; raceTitle: string }) {
  const [pending, startTransition] = useTransition();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const noteId = useId();

  function approve() {
    startTransition(async () => {
      // on success the action redirects to the new draft race
      const res = await approveRequest(id);
      if (res && !res.ok) {
        toast.error(res.error);
        setApproveOpen(false);
      }
    });
  }

  function reject() {
    setError(null);
    startTransition(async () => {
      const res = await rejectRequest(id, note);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(res.message);
      setRejectOpen(false);
      setNote("");
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <Button disabled={pending} onClick={() => setApproveOpen(true)}>
          <Check aria-hidden /> Approve
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve {organization}&apos;s request?</DialogTitle>
            <DialogDescription>
              We&apos;ll create &ldquo;{raceTitle}&rdquo; as a draft race under your account, filled in from the request. Runners
              can&apos;t see it until you add fees and payment details and open registration.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Not yet</DialogClose>
            <Button disabled={pending} onClick={approve}>
              {pending ? "Creating draft…" : "Approve and create draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <Button variant="destructive" disabled={pending} onClick={() => setRejectOpen(true)}>
          <X aria-hidden /> Reject
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this request?</DialogTitle>
            <DialogDescription>
              The reason is saved with the request. RaceLink doesn&apos;t send emails yet, so reply to {organization} yourself.
            </DialogDescription>
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
              placeholder="The date clashes with another race. Send a new request with another date."
              aria-invalid={!!error || undefined}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Keep for later</DialogClose>
            <Button variant="destructive" disabled={pending} onClick={reject}>
              {pending ? "Rejecting…" : "Reject request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
