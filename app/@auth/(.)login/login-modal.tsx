"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export function LoginModal({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  // next keeps route state pag umalis, kaya buksan ulit pag bumalik
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(true);
  }, []);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={setOpen}
      // hintayin matapos ang exit animation bago bumalik
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) router.back();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-brand-deep/45 backdrop-blur-sm transition-[opacity,backdrop-filter] duration-300 ease-out data-ending-style:opacity-0 data-ending-style:backdrop-blur-none data-ending-style:duration-200 data-starting-style:opacity-0 data-starting-style:backdrop-blur-none motion-reduce:transition-none" />
        <DialogPrimitive.Viewport className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
          <DialogPrimitive.Popup
            aria-label="Log in or sign up to RaceLink"
            className="relative w-full max-w-sm rounded-xl bg-card p-6 text-card-foreground shadow-[0_24px_60px_-12px_rgb(59_0_0/0.3)] ring-1 ring-foreground/10 outline-none transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] data-ending-style:translate-y-2 data-ending-style:scale-[0.97] data-ending-style:opacity-0 data-ending-style:duration-200 data-ending-style:ease-in data-starting-style:translate-y-4 data-starting-style:scale-[0.97] data-starting-style:opacity-0 motion-reduce:transition-none"
          >
            <div className="mb-5 flex items-center justify-between">
              <Logo className="h-8" />
              <DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" className="-mr-2" />}>
                <XIcon />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </div>
            {children}
          </DialogPrimitive.Popup>
        </DialogPrimitive.Viewport>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
