"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

type NavLink = { href: string; label: string };

export function PublicNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <>
      <nav aria-label="Main" className="hidden flex-1 items-center gap-1 self-stretch md:flex">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active(l.href) ? "page" : undefined}
            className="flex h-full items-center border-b-2 border-transparent px-3 pt-0.5 text-[0.95rem] font-medium text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:border-link aria-[current=page]:text-foreground"
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <Button
        variant="ghost"
        size="icon-lg"
        className="order-last -ml-3 md:hidden"
        aria-expanded={open}
        aria-controls="public-menu"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X aria-hidden /> : <Menu aria-hidden />}
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      </Button>

      {open && (
        <div id="public-menu" className="absolute inset-x-0 top-16 border-b bg-background px-4 pt-2 pb-4 shadow-sm md:hidden">
          <nav aria-label="Main mobile" className="grid gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={active(l.href) ? "page" : undefined}
                className="rounded-md px-3 py-2.5 font-medium hover:bg-muted aria-[current=page]:text-link"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:hidden">
            <Link href="/login" scroll={false} onClick={() => setOpen(false)} className={buttonVariants({ variant: "outline", size: "lg" })}>
              Log in
            </Link>
            <Link href="/login?tab=signup" scroll={false} onClick={() => setOpen(false)} className={buttonVariants({ size: "lg" })}>
              Sign up
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
