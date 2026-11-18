import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronLeft, ExternalLink } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { getManagedEvent } from "@/lib/queries/organizer";
import { requireUser } from "@/lib/session";
import { fileUrl } from "@/lib/storage";
import { DeleteEventButton } from "../../delete-event-button";
import { EventForm } from "../../event-form";
import { DocumentsPanel } from "./documents-panel";

export const metadata: Metadata = { title: "Edit race" };

export default function EditEventPage({ params, searchParams }: PageProps<"/organizer/events/[id]">) {
  return (
    <div className="grid gap-6">
      <Link href="/organizer" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden /> Manage events
      </Link>
      <Suspense fallback={<div className="h-96 rounded-lg bg-card ring-1 ring-border" />}>
        <Editor params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Editor({ params, searchParams }: Pick<PageProps<"/organizer/events/[id]">, "params" | "searchParams">) {
  const user = await requireUser("organizer", "admin");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const eventId = Number(id);
  if (!Number.isInteger(eventId)) notFound();

  const event = await getManagedEvent(user, eventId);
  if (!event) notFound();

  const [bannerUrl, documents] = await Promise.all([
    event.bannerKey ? fileUrl(event.bannerKey) : null,
    Promise.all(event.documents.map(async (d) => ({ id: d.id, title: d.title, url: await fileUrl(d.fileKey, d.title) }))),
  ]);
  const notice = query.created ? "Race created." : query.saved ? "Changes saved." : null;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl font-extrabold tracking-tight">{event.title}</h1>
            <StatusBadge status={event.status} />
          </div>
          <p className="mt-1 text-muted-foreground">
            {event.bookingCount === 0
              ? "No bookings yet."
              : `${event.bookingCount} booking${event.bookingCount === 1 ? "" : "s"}. Bookings keep the fee they were made with.`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link href={`/organizer/events/${event.id}/registrations`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Registrations
          </Link>
          {(event.status === "open" || event.status === "closed") && (
            <Link href={`/?event=${event.id}#races`} className="inline-flex items-center gap-1.5 px-2 text-sm font-medium text-primary hover:underline">
              View on site <ExternalLink className="size-3.5" aria-hidden />
            </Link>
          )}
          <DeleteEventButton id={event.id} title={event.title} hasBookings={event.bookingCount > 0} redirectTo="/organizer" />
        </div>
      </div>

      {notice && (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
          <CheckCircle2 className="size-4" aria-hidden /> {notice}
        </p>
      )}

      <EventForm
        key={event.updatedAt.getTime()}
        bannerUrl={bannerUrl}
        event={{
          id: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          eventDate: event.eventDate,
          startTime: event.startTime,
          registrationCloses: event.registrationCloses,
          capacity: event.capacity,
          paymentInstructions: event.paymentInstructions,
          status: event.status,
          bannerKey: event.bannerKey,
          distances: event.distances,
          sizes: event.sizes,
        }}
      />

      <DocumentsPanel eventId={event.id} documents={documents} />
    </>
  );
}
