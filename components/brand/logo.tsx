import Image from "next/image";
import { cn } from "@/lib/utils";
import light from "@/public/brand/racelink-logo-light.png";
import dark from "@/public/brand/racelink-logo-dark.png";

// auto = follows the light/dark theme; light/dark = force one (dark is for the deep red band)
export function Logo({
  tone = "auto",
  className,
  priority,
}: {
  tone?: "auto" | "light" | "dark";
  className?: string;
  priority?: boolean;
}) {
  const base = cn("h-9 w-auto select-none", className);
  if (tone !== "auto") {
    return <Image src={tone === "light" ? light : dark} alt="RaceLink" priority={priority} className={base} />;
  }
  return (
    <>
      <Image src={light} alt="RaceLink" priority={priority} className={cn(base, "dark:hidden")} />
      <Image src={dark} alt="RaceLink" priority={priority} className={cn(base, "hidden dark:block")} />
    </>
  );
}
