"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, UserRound, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AppNavItem = {
  href: string;
  label: string;
  exact?: boolean;
  badgeKey?: "requests";
};

type Props = {
  home: string;
  items: AppNavItem[];
  badges: Record<"requests", number>;
  user: { name: string; role: string; href?: string };
  logo: ReactNode;
  logout: ReactNode;
};

export function AppNav({ home, items, badges, user, logo, logout }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // longest matching prefix wins, para hindi sabay active ang /organizer at /organizer/events
  const current = items
    .filter((i) =>
      i.exact
        ? pathname === i.href
        : pathname === i.href || pathname.startsWith(`${i.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const badge = (item: AppNavItem) => {
    const n = item.badgeKey ? badges[item.badgeKey] : 0;
    return n > 0 ? (
      <span
        className="ml-1.5 text-xs font-bold text-primary tabular-nums"
        aria-label={`${n} waiting`}
      >
        {n}
      </span>
    ) : null;
  };

  return (
    <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
      <Link href={home} aria-label="RaceLink home" className="shrink-0">
        {logo}
      </Link>

      <nav
        aria-label="Main"
        className="hidden flex-1 items-stretch gap-1 self-stretch lg:flex"
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current === item.href ? "page" : undefined}
            className="flex items-center border-b-2 border-transparent px-3 pt-0.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:border-primary aria-[current=page]:text-foreground"
          >
            {item.label}
            {badge(item)}
          </Link>
        ))}
      </nav>

      <div className="ml-auto hidden items-center gap-3 lg:flex">
        {user.href ? (
          <Link
            href={user.href}
            aria-current={pathname === user.href ? "page" : undefined}
            className="group flex items-center gap-2.5 rounded-lg py-1 pr-2 pl-1 transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-muted"
          >
            <Avatar name={user.name} />
            <span className="text-left leading-tight">
              <span className="block text-sm font-semibold group-hover:text-primary group-aria-[current=page]:text-primary">
                {user.name}
              </span>
              <span className="block text-xs text-muted-foreground">
                View profile
              </span>
            </span>
          </Link>
        ) : (
          <div className="text-right leading-tight">
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.role}</p>
          </div>
        )}
        <ThemeToggle />
        {logout}
      </div>

      <ThemeToggle className="ml-auto lg:hidden" />
      <Button
        variant="ghost"
        size="icon-lg"
        className="lg:hidden"
        aria-expanded={open}
        aria-controls="app-menu"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X aria-hidden /> : <Menu aria-hidden />}
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      </Button>

      {open && (
        <div
          id="app-menu"
          className="absolute inset-x-0 top-16 border-b bg-background px-4 pt-2 pb-4 shadow-sm lg:hidden"
        >
          {items.length > 0 && (
            <nav aria-label="Main mobile" className="grid gap-1">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={current === item.href ? "page" : undefined}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2.5 font-medium hover:bg-muted aria-[current=page]:text-primary",
                  )}
                >
                  {item.label}
                  {badge(item)}
                </Link>
              ))}
            </nav>
          )}
          <div
            className={cn(
              "flex items-center justify-between gap-3",
              items.length > 0 && "mt-3 border-t pt-3",
            )}
          >
            {user.href ? (
              <Link
                href={user.href}
                onClick={() => setOpen(false)}
                aria-current={pathname === user.href ? "page" : undefined}
                className="flex min-w-0 items-center gap-2.5 rounded-md py-1 pr-2 text-sm hover:text-primary aria-[current=page]:text-primary"
              >
                <Avatar name={user.name} />
                <span className="min-w-0 leading-tight">
                  <span className="block truncate font-semibold">
                    {user.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    View profile
                  </span>
                </span>
              </Link>
            ) : (
              <p className="flex items-center gap-2 text-sm">
                <UserRound
                  className="size-4 text-muted-foreground"
                  aria-hidden
                />
                <span className="font-semibold">{user.name}</span>
                <span className="text-muted-foreground">· {user.role}</span>
              </p>
            )}
            {logout}
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden
      className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-deep text-xs font-bold text-white"
    >
      {initials}
    </span>
  );
}
