import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-brand-deep text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
        <Logo tone="dark" className="h-8 self-start md:self-auto" />
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px]">
          <Link href="/" className="text-white/80 hover:text-white">
            Home
          </Link>
          <Link href="/request" className="text-white/80 hover:text-white">
            Request a race
          </Link>
          <Link href="/about" className="text-white/80 hover:text-white">
            About us
          </Link>
          <Link href="/login" scroll={false} className="text-white/80 hover:text-white">
            Log in
          </Link>
        </nav>
      </div>
    </footer>
  );
}
