import { csvResponse, slugify } from "@/lib/csv";
import { getRegistrations } from "@/lib/queries/registrations";
import { canManageEvents } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";

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
  return csvResponse(header, rows, `${slugify(data.event.title, "race")}-registrations.csv`);
}
