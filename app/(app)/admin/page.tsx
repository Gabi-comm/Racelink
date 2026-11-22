import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Ban, Search } from "lucide-react";
import { StatusMark } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getUsers } from "@/lib/queries/users";
import { ROLE_LABEL, isRole, type Role } from "@/lib/roles";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { FilterTabs } from "@/components/filter-tabs";
import { UrlSelect } from "@/components/organizer/url-select";
import { BanButton, RoleSelect } from "./user-actions";

export const metadata: Metadata = { title: "Users" };

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Users</h1>
        <p className="mt-1 text-muted-foreground">Change what each account can do, or ban an account that shouldn&apos;t have access.</p>
      </div>
      <Suspense fallback={<div className="h-96 rounded-lg bg-card ring-1 ring-border" />}>
        <Users searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: "", label: "Any status" },
  { value: "active", label: "Active" },
  { value: "banned", label: "Banned" },
];
const SORT_OPTIONS = [
  { value: "", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name A to Z" },
];

async function Users({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  const me = await requireUser("admin");
  const [list, query] = await Promise.all([getUsers(), searchParams]);

  const role: Role | "all" = typeof query.role === "string" && isRole(query.role) ? query.role : "all";
  const status = query.status === "active" || query.status === "banned" ? query.status : "";
  const sort = query.sort === "oldest" || query.sort === "name" ? query.sort : "";
  const q = typeof query.q === "string" ? query.q.trim() : "";
  const needle = q.toLowerCase();

  const byStatus = list.filter((u) => !status || (status === "banned" ? !!u.banned : !u.banned));
  const bySearch = byStatus.filter((u) => !needle || u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle));
  const shown = bySearch
    .filter((u) => role === "all" || u.role === role)
    .sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) : sort === "oldest" ? a.createdAt.getTime() - b.createdAt.getTime() : 0,
    );
  const filtered = role !== "all" || !!status || !!q || !!sort;

  const href = (r: Role | "all") => {
    const p = new URLSearchParams();
    if (r !== "all") p.set("role", r);
    if (status) p.set("status", status);
    if (sort) p.set("sort", sort);
    if (q) p.set("q", q);
    const s = p.toString();
    return `/admin${s ? `?${s}` : ""}`;
  };
  // tab counts follow the other filters, so the numbers match what you'd see
  const countFor = (r: Role | "all") => (r === "all" ? bySearch.length : bySearch.filter((u) => u.role === r).length);
  const joined = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" });

  return (
    <>
      <FilterTabs
        label="Filter by role"
        items={(["all", "runner", "organizer", "admin"] as const).map((r) => ({
          href: href(r),
          label: r === "all" ? "Everyone" : r === "runner" ? "Users (runners)" : `${ROLE_LABEL[r]}s`,
          count: countFor(r),
          active: role === r,
        }))}
      />
      <div className="grid gap-3 rounded-lg bg-card p-4 ring-1 ring-border sm:grid-cols-[1fr_11rem_11rem] sm:items-end">
        <form className="grid gap-1" role="search">
          <label htmlFor="user-search" className="text-xs font-medium text-muted-foreground">
            Search
          </label>
          {role !== "all" && <input type="hidden" name="role" value={role} />}
          {status && <input type="hidden" name="status" value={status} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id="user-search" name="q" defaultValue={q} placeholder="Name or email" className="h-9 pl-8" />
          </div>
        </form>
        <UrlSelect param="status" label="Status" value={status} options={STATUS_OPTIONS} />
        <UrlSelect param="sort" label="Sort" value={sort} options={SORT_OPTIONS} />
      </div>
      <div className="-mt-2 flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          Showing <span className="font-semibold text-foreground tabular-nums">{shown.length}</span> of {list.length} accounts
        </p>
        {filtered && (
          <Link href="/admin" className="font-medium text-primary hover:underline">
            Clear filters
          </Link>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-lg bg-card p-10 text-center ring-1 ring-border">
          <p className="font-display text-2xl font-bold">No users match</p>
          <p className="mt-2 text-muted-foreground">Try another role or status, or clear the search.</p>
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
                  <TableRow key={u.id} className={cn(u.banned && "bg-destructive/[0.03]")}>
                    <TableCell className="pl-4">
                      <p className="flex items-center gap-2 font-semibold">
                        {u.name}
                        {self && <span className="text-xs font-medium text-muted-foreground">(you)</span>}
                        {u.banned && (
                          <StatusMark tone="danger" icon={Ban}>
                            Banned
                          </StatusMark>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                      {u.banned && u.banReason && <p className="text-xs text-destructive">Reason: {u.banReason}</p>}
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
