import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { PublicNav } from "./public-nav";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/request", label: "Request" },
  { href: "/about", label: "About us" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/" aria-label="RaceLink home" className="shrink-0">
          <Logo className="h-11" priority />
        </Link>
        <PublicNav links={LINKS} />
        <ThemeToggle className="ml-auto md:ml-0" />
        <div className="hidden items-center gap-2 sm:flex">
          <Link href="/login" scroll={false} className={buttonVariants({ variant: "ghost", size: "lg" })}>
            Log in
          </Link>
          <Link href="/login?tab=signup" scroll={false} className={buttonVariants({ size: "lg" })}>
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
