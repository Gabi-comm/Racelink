"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { acceptTerms } from "@/app/(app)/terms-actions";
import { LogOutButton } from "@/components/log-out-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TERMS_SECTIONS } from "@/lib/terms";

// blocks the runner side until the runner consents; there is no close button,
// Escape and outside clicks do nothing. The only other way out is logging out.
export function TermsDialog() {
  const [open, setOpen] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [pending, startTransition] = useTransition();
  const checkId = useId();

  function consent() {
    startTransition(async () => {
      const res = await acceptTerms();
      if (!res.ok) {
        toast.error(res.error ?? "Couldn't save your consent. Try again.");
        return;
      }
      setOpen(false);
      toast.success("Thanks. You're all set.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={() => {}} disablePointerDismissal>
      <DialogContent showCloseButton={false} className="gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="border-b p-5">
          <DialogTitle className="font-display text-xl">Terms and Conditions</DialogTitle>
          <DialogDescription>Read and accept these before you register for races on RaceLink.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] overflow-y-auto overscroll-contain px-5 py-4" tabIndex={0} aria-label="Terms and Conditions text">
          <div className="grid gap-4">
            {TERMS_SECTIONS.map((s) => (
              <section key={s.title} className="grid gap-1.5">
                <h3 className="font-semibold">{s.title}</h3>
                {s.body.map((p) => (
                  <p key={p} className="text-muted-foreground">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </div>
        <div className="grid gap-4 border-t p-5">
          <label htmlFor={checkId} className="flex items-start gap-2.5 text-sm">
            <Checkbox id={checkId} checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
            <span>I have read and agree to the Terms and Conditions, and I consent to RaceLink processing my personal data as described above.</span>
          </label>
          <div className="flex items-center justify-between gap-2">
            <LogOutButton />
            <Button disabled={!agreed || pending} onClick={consent}>
              {pending ? "Saving…" : "I consent"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
