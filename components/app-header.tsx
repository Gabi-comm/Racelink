import { Suspense } from "react";
import Link from "next/link";
import { Footprints } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LogOutButton } from "@/components/log-out-button";
import { ROLE_LABEL, type Role } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";

const NAV: { href: string; label: string; roles: Role[] }[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["runner", "organizer", "admin"] },
  { href: "/races", label: "Races", roles: ["runner"] },
  { href: "/bookings", label: "My Bookings", roles: ["runner"] },
  { href: "/organizer", label: "Manage Events", roles: ["organizer", "admin"] },
  { href: "/admin", label: "Users", roles: ["admin"] },
];

export function AppHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Footprints className="size-5" aria-hidden />
          RaceLink
        </Link>
        <Suspense fallback={<div className="flex-1" />}>
          <UserNav />
        </Suspense>
      </div>
    </header>
  );
}

async function UserNav() {
  const user = await getCurrentUser();
  if (!user) return <div className="flex-1" />;

  return (
    <>
      <nav aria-label="Main" className="flex flex-1 items-center gap-1 text-sm">
        {NAV.filter((item) => item.roles.includes(user.role)).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <Link href="/profile" className="text-sm font-medium hover:underline">
          <span className="hidden sm:inline">{user.name}</span>
          <span className="sm:hidden">Profile</span>
        </Link>
        <Badge variant="secondary">{ROLE_LABEL[user.role]}</Badge>
        <LogOutButton />
      </div>
    </>
  );
}
