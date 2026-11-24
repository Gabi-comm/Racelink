import { csvResponse, slugify } from "@/lib/csv";
import { formatDate, formatPeso } from "@/lib/events";
import { inTab, isParticipantTab, PARTICIPANT_TABS } from "@/lib/participant-filters";
import { pdfResponse, pdfTable, type PdfColumn } from "@/lib/pdf-table";
import { getParticipants, type Participant } from "@/lib/queries/registrations";
import { canManageEvents } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";

const REFUND_LABEL = { requested: "Review refund", processed: "Refund processed" } as const;
// short forms so they fit the PDF column
const PDF_REFUND = { requested: "To review", processed: "Processed" } as const;
const STATUS_LABEL = { pending: "To review", approved: "Confirmed", rejected: "Rejected", cancelled: "Cancelled" } as const;

const bib = (n: number | null) => (n === null ? "" : String(n).padStart(4, "0"));
const refundLabel = (p: Participant) => (p.refund ? REFUND_LABEL[p.refund.status] : p.status === "cancelled" ? "No refund requested" : "");

// GET /api/participants/export?status=approved&event=6&format=pdf — one tab's rows, one race or all races
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Log in to export participants.", { status: 401 });
  if (!canManageEvents(user.role)) return new Response("Not found", { status: 404 });

  const params = new URL(request.url).searchParams;
  const status = params.get("status") ?? "all";
  if (!isParticipantTab(status)) return new Response("Unknown tab", { status: 400 });
  const format = params.get("format") ?? "csv";
  if (format !== "csv" && format !== "pdf") return new Response("Unknown format", { status: 400 });
  const eventParam = params.get("event");
  const eventId = eventParam ? Number(eventParam) : null;

  const { races, list } = await getParticipants(user);
  const race = eventId === null ? null : races.find((r) => r.id === eventId);
  if (eventId !== null && !race) return new Response("Not found", { status: 404 });

  const rows = list.filter((p) => (!race || p.eventId === race.id) && inTab(p, status));
  const withRefund = status === "cancelled" || status === "all";
  const tab = PARTICIPANT_TABS.find((t) => t.value === status)!.label;
  const filename = `${slugify(race?.title ?? "all-races")}-${slugify(tab)}`;

  if (format === "pdf") {
    const columns: PdfColumn[] = [
      { label: "Bib", width: 30 },
      { label: "Runner", width: 100 },
      { label: "Email", width: 146 },
      { label: "Phone", width: 64 },
      ...(race ? [] : [{ label: "Race", width: 100 }]),
      { label: "Distance", width: 44 },
      { label: "Shirt", width: 34 },
      { label: "Fee", width: 52, align: "right" as const },
      { label: "Paid", width: 52, align: "right" as const },
      { label: "Reference no", width: 76 },
      { label: "Status", width: 50 },
      ...(withRefund ? [{ label: "Refund", width: 76 }] : []),
    ];
    const body = rows.map((p) => [
      bib(p.bibNumber),
      p.runnerName,
      p.email,
      p.phone ?? "",
      ...(race ? [] : [p.eventTitle]),
      p.distanceLabel,
      p.tshirtSize,
      formatPeso(p.price),
      p.proof ? formatPeso(p.proof.amount) : "",
      p.proof?.referenceNo ?? "",
      STATUS_LABEL[p.status],
      ...(withRefund ? [p.refund ? PDF_REFUND[p.refund.status] : p.status === "cancelled" ? "None" : ""] : []),
    ]);
    const generated = new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" }).format(new Date());
    const bytes = await pdfTable({
      title: `${race ? race.title : "All races"}: ${tab}`,
      meta: `${rows.length} runner${rows.length === 1 ? "" : "s"}${race ? ` · Race day ${formatDate(race.eventDate)}` : ""} · Generated ${generated}`,
      columns,
      rows: body,
    });
    return pdfResponse(bytes, `${filename}.pdf`);
  }

  const header = [
    "Race", "Race day", "Bib", "Runner", "Email", "Phone", "Emergency contact", "Emergency phone",
    "Distance", "Fee", "Shirt", "Status", "Amount paid", "Reference no", "Registered at",
    ...(withRefund ? ["Refund status", "Refund reason", "Refund email", "Refund phone", "Refund requested at"] : []),
  ];
  const body = rows.map((p) => [
    p.eventTitle, p.eventDate, p.bibNumber, p.runnerName, p.email, p.phone, p.emergencyName, p.emergencyPhone,
    p.distanceLabel, p.price.toFixed(2), p.tshirtSize, p.status, p.proof?.amount.toFixed(2), p.proof?.referenceNo,
    p.createdAt.toISOString(),
    ...(withRefund
      ? p.refund
        ? [refundLabel(p), p.refund.reason, p.refund.email, p.refund.phone, p.refund.createdAt.toISOString()]
        : [refundLabel(p), "", "", "", ""]
      : []),
  ]);
  return csvResponse(header, body, `${filename}.csv`);
}
