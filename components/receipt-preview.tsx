"use client";

import { useState, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// receipt in a pop-up instead of a new tab; photo muna, PDF kapag hindi image
export function ReceiptPreview({ receiptId, className, children = "View receipt" }: { receiptId: number; className?: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pdf, setPdf] = useState(false);
  const src = `/api/receipts/${receiptId}`;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn("cursor-pointer text-left outline-none focus-visible:underline", className)}>
        {children}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[92dvh] flex-col gap-3 sm:max-w-3xl">
          <div className="flex items-center justify-between gap-4 pr-8">
            <DialogTitle>Payment receipt</DialogTitle>
            <a href={src} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-link hover:underline">
              Open full size <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
          </div>
          {open && (
            <div className="min-h-0 flex-1 overflow-auto rounded-lg bg-muted">
              {pdf ? (
                <iframe src={src} title="Payment receipt" className="h-[75dvh] w-full" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="Payment receipt" onError={() => setPdf(true)} className="mx-auto max-h-[75dvh] w-auto object-contain" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
