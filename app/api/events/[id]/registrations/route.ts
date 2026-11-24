import { getRegistrations } from "@/lib/queries/registrations";
import { canManageEvents } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";

// csv cell, iwas formula injection sa Excel
function cell(v: string | number | null | undefined) {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(_request: Request, ctx: RouteContext<"/api/events/[id]/registrations">) {
  const user = await getCurrentUser();
  if (!user) return new Response("Log in to export registrations.", { status: 401 });
  if (!canManageEvents(user.role)) return new Response("Not found", { status: 404 });

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return new Response("Not found", { status: 404 });

  const data = await getRegistrations(user, id);
  if (!data) return new Response("Not found", { status: 404 });

  const header = [
    "Bib", "Runner", "Email", "Phone", "Gender", "Birthdate", "Emergency contact", "Emergency phone",
    "Distance", "Fee", "Shirt", "Status", "Amount paid", "Reference no", "Registered at",
  ];
  const rows = data.list.map((r) => [
    r.bibNumber, r.runnerName, r.email, r.phone, r.gender, r.birthdate, r.emergencyName, r.emergencyPhone,
    r.distanceLabel, r.price.toFixed(2), r.tshirtSize, r.status, r.proof?.amount.toFixed(2), r.proof?.referenceNo,
    r.createdAt.toISOString(),
  ]);
  const csv = [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
  const slug = data.event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "race";

  return new Response(`﻿${csv}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-registrations.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
