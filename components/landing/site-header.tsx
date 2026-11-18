import { Suspense } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";
import { Wordmark } from "./wordmark";

const LINKS = [
  { href: "#races", label: "Races" },
  { href: "#how", label: "How it works" },
  { href: "#about", label: "About us" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4">
        <Link href="/" aria-label="RaceLink home">
          <Wordmark />
        </Link>
        <nav aria-label="Sections" className="hidden flex-1 items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-[0.95rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Suspense fallback={<div className="h-9 w-40" />}>
            <AccountLinks />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

async function AccountLinks() {
  const user = await getCurrentUser();
  if (user) {
    return (
      <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
        Go to dashboard
      </Link>
    );
  }
  return (
    <>
      <Link href="/login" className={buttonVariants({ variant: "ghost", size: "lg" })}>
        Log in
      </Link>
      <Link href="/login?tab=signup" className={buttonVariants({ size: "lg" })}>
        Sign up
      </Link>
    </>
  );
}
