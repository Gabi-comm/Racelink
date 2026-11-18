import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROLES } from "@/lib/constants";
import { getUsers } from "@/lib/queries/users";
import { ROLE_LABEL, isRole, type Role } from "@/lib/roles";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { BanButton, RoleSelect } from "./user-actions";

export const metadata: Metadata = { title: "Users" };

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Users</h1>
        <p className="mt-1 text-muted-foreground">Change what each account can do, or ban an account that shouldn&apos;t have access.</p>
      </div>
      <Suspense fallback={<div className="h-96 rounded-lg bg-card ring-1 ring-border" />}>
        <Users searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Users({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  const me = await requireUser("admin");
  const [list, query] = await Promise.all([getUsers(), searchParams]);

  const role: Role | "all" = typeof query.role === "string" && isRole(query.role) ? query.role : "all";
  const q = typeof query.q === "string" ? query.q.trim().toLowerCase() : "";
  const shown = list.filter(
    (u) => (role === "all" || u.role === role) && (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
  );
  const href = (r: Role | "all") => {
    const p = new URLSearchParams();
    if (r !== "all") p.set("role", r);
    if (q) p.set("q", q);
    const s = p.toString();
    return `/admin${s ? `?${s}` : ""}`;
  };
  const countFor = (r: Role | "all") => (r === "all" ? list.length : list.filter((u) => u.role === r).length);
  const joined = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filter by role" className="flex flex-wrap gap-1">
          {(["all", ...ROLES] as const).map((r) => (
            <Link
              key={r}
              href={href(r)}
              aria-current={role === r ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                role === r && "bg-foreground text-background hover:bg-foreground hover:text-background",
              )}
            >
              {r === "all" ? "Everyone" : `${ROLE_LABEL[r]}s`} <span className="tabular-nums opacity-70">{countFor(r)}</span>
            </Link>
          ))}
        </nav>
        <form className="relative w-full sm:w-64" role="search">
          {role !== "all" && <input type="hidden" name="role" value={role} />}
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input name="q" defaultValue={q} placeholder="Name or email" aria-label="Search users" className="h-9 pl-8" />
        </form>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-lg bg-card p-10 text-center ring-1 ring-border">
          <p className="font-display text-2xl font-bold">No users match</p>
          <p className="mt-2 text-muted-foreground">Try another role or clear the search.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-card ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Bookings</TableHead>
                <TableHead className="text-right">Races</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="pr-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((u) => {
                const self = u.id === me.id;
                return (
                  <TableRow key={u.id} className={cn(u.banned && "bg-red-50/60")}>
                    <TableCell className="pl-4">
                      <p className="flex items-center gap-2 font-semibold">
                        {u.name}
                        {self && <Badge variant="secondary">You</Badge>}
                        {u.banned && <Badge variant="destructive">Banned</Badge>}
                      </p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                      {u.banned && u.banReason && <p className="text-xs text-red-800">Reason: {u.banReason}</p>}
                    </TableCell>
                    <TableCell>
                      {self ? (
                        <span className="text-sm font-medium">{ROLE_LABEL[isRole(u.role) ? u.role : "runner"]}</span>
                      ) : (
                        <RoleSelect key={u.role} userId={u.id} name={u.name} role={u.role} />
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{u.bookings}</TableCell>
                    <TableCell className="text-right tabular-nums">{u.events}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{joined.format(u.createdAt)}</TableCell>
                    <TableCell className="pr-4 text-right">{!self && <BanButton userId={u.id} name={u.name} banned={!!u.banned} />}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
