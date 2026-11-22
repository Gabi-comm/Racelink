import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LogOutButton } from "@/components/log-out-button";
import { getPendingRequestCount } from "@/lib/queries/requests";
import { ROLE_LABEL, homeFor, type Role } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import { AppNav, type AppNavItem } from "./app-nav";

const ORGANIZER: AppNavItem[] = [
  { href: "/organizer", label: "Dashboard", exact: true },
  { href: "/organizer/participants", label: "Manage Participants" },
  { href: "/organizer/events", label: "Manage Events" },
  { href: "/organizer/requests", label: "Request Forms", badgeKey: "requests" },
];

const NAV: Record<Role, AppNavItem[]> = {
  runner: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/races", label: "Races" },
    { href: "/bookings", label: "My Bookings" },
  ],
  organizer: ORGANIZER,
  // admin only manages users, so no tabs: /admin is their whole app
  admin: [],
};

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Suspense fallback={<HeaderShell />}>
        <UserNav />
      </Suspense>
    </header>
  );
}

function HeaderShell({ home = "/" }: { home?: string }) {
  return (
    <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
      <Link href={home} aria-label="RaceLink home" className="shrink-0">
        <Logo className="h-10" />
      </Link>
    </div>
  );
}

async function UserNav() {
  const user = await getCurrentUser();
  if (!user) return <HeaderShell />;
  const pending = user.role === "runner" ? 0 : await getPendingRequestCount();

  return (
    <AppNav
      home={homeFor(user.role)}
      items={NAV[user.role]}
      badges={{ requests: pending }}
      // runners open their profile by clicking their name
      user={{ name: user.name, role: ROLE_LABEL[user.role], href: user.role === "runner" ? "/profile" : undefined }}
      logo={<Logo className="h-10" priority />}
      logout={<LogOutButton />}
    />
  );
}
