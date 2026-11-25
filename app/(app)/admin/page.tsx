import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Search } from "lucide-react";
import { PageHeader, TABLE_SHELL } from "@/components/stat";
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
      <PageHeader eyebrow="Platform administration" title="Users & roles" description="Manage access, permissions, and account status." />
      <Users searchParams={searchParams} />
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
        variant="underline"
        label="Filter by role"
        items={(["all", "runner", "organizer", "admin"] as const).map((r) => ({
          href: href(r),
          label: r === "all" ? "Everyone" : r === "runner" ? "Users (runners)" : `${ROLE_LABEL[r]}s`,
          count: countFor(r),
          active: role === r,
        }))}
      />
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
        <Form action="/admin" scroll={false} className="w-full sm:w-80" role="search">
          <label htmlFor="user-search" className="sr-only">
            Search
          </label>
          {role !== "all" && <input type="hidden" name="role" value={role} />}
          {status && <input type="hidden" name="status" value={status} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id="user-search" name="q" defaultValue={q} placeholder="Name or email" className="h-12 rounded-xl pl-10 text-base" />
          </div>
        </Form>
        <UrlSelect big param="status" label="Status" value={status} options={STATUS_OPTIONS} className="w-full sm:w-52" />
        <UrlSelect big param="sort" label="Sort" value={sort} options={SORT_OPTIONS} className="w-full sm:w-52" />
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          {filtered && (
            <Link href="/admin" className="font-medium text-link hover:underline">
              Clear filters
            </Link>
          )}
          {/* count pops when it changes */}
          <p>
            Showing{" "}
            <span key={shown.length} className="demo-pop inline-block font-bold text-foreground tabular-nums">
              {shown.length}
            </span>{" "}
            of <span className="font-bold text-foreground tabular-nums">{list.length.toLocaleString("en-PH")}</span> accounts
          </p>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-lg bg-card p-10 text-center ring-1 ring-border">
          <p className="font-display text-2xl font-bold">No users match</p>
          <p className="mt-2 text-muted-foreground">Try another role or status, or clear the search.</p>
        </div>
      ) : (
        <div className={TABLE_SHELL}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Races</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="pr-5">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((u) => {
                const self = u.id === me.id;
                return (
                  <TableRow key={u.id} className={cn("transition-colors duration-300", u.banned && "bg-destructive/[0.03]")}>
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <Initials name={u.name} />
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-semibold">
                            {u.name}
                            {self && <span className={cn(PILL, "bg-brand-light/20 text-link")}>You</span>}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{u.email}</p>
                          {u.banned && u.banReason && <p className="text-xs text-destructive">Reason: {u.banReason}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {u.banned ? (
                        <span className={cn(PILL, "bg-destructive/10 text-destructive")}>Banned</span>
                      ) : (
                        <span className={cn(PILL, "bg-marking text-marking-foreground")}>Active</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {self ? (
                        <span className="text-sm font-semibold">{ROLE_LABEL[isRole(u.role) ? u.role : "runner"]}</span>
                      ) : (
                        <RoleSelect key={u.role} userId={u.id} name={u.name} role={u.role} />
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">{u.bookings || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="tabular-nums">{u.events || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="whitespace-nowrap">{joined.format(u.createdAt)}</TableCell>
                    <TableCell className="pr-5">{!self && <BanButton userId={u.id} name={u.name} banned={!!u.banned} />}</TableCell>
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

const PILL = "inline-flex items-center rounded-full px-3 py-1 text-[0.7rem] font-bold tracking-[0.12em] whitespace-nowrap uppercase";

function Initials({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-[#7b8ce0] text-sm font-bold text-white">
      {initials}
    </span>
  );
}
