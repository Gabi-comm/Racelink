import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Image src="/brand/racelink-logo.png" alt="RaceLink" width={144} height={144} className="-my-10 -ml-4 size-36" />
          <p className="max-w-xs text-sm text-background/70">
            Race registration for runners and organizers. A University of the East, College of Computer Studies project.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a href="#races" className="text-background/80 hover:text-background">Races</a>
          <a href="#how" className="text-background/80 hover:text-background">How it works</a>
          <a href="#about" className="text-background/80 hover:text-background">About us</a>
          <Link href="/login" className="text-background/80 hover:text-background">Log in</Link>
        </nav>
      </div>
    </footer>
  );
}
