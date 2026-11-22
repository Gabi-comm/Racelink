"use client";

import { useActionState, useState, useTransition, type ReactNode } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { PaymentDetails } from "@/components/payment-details";
import { ReceiptPicker } from "@/components/receipt-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { GENDERS } from "@/lib/constants";
import type { FormState } from "@/lib/booking-form";
import { formatDate, formatPeso, formatTime } from "@/lib/events";
import type { RegisterContext } from "@/lib/queries/bookings";
import { register } from "../../bookings/actions";

export function RegisterForm({ ctx, runnerName }: { ctx: RegisterContext; runnerName: string }) {
  const { event, distances, sizes, profile } = ctx;
  const [state, formAction] = useActionState<FormState, FormData>(register.bind(null, event.id), {});
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const firstOpen = distances.find((d) => d.left !== 0);
  const [distanceId, setDistanceId] = useState<number | null>(distances.length === 1 && firstOpen ? firstOpen.id : null);
  const err = state.fieldErrors ?? {};
  const selected = distances.find((d) => d.id === distanceId);
  const start = formatTime(event.startTime);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="grid gap-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Register for {event.title}</h1>
          <p className="mt-1 text-muted-foreground">Registering as {runnerName}.</p>
        </div>

        <Step n={1} title="Pick your distance" error={err.distanceId}>
          <div className="grid gap-2 sm:grid-cols-2">
            {distances.map((d) => {
              const full = d.left === 0;
              return (
                <label
                  key={d.id}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-input bg-background p-4 has-checked:border-primary has-checked:bg-primary/5 has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                    full && "cursor-not-allowed opacity-50",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="distanceId"
                      value={d.id}
                      disabled={full}
                      checked={distanceId === d.id}
                      onChange={() => setDistanceId(d.id)}
                      className="size-4 accent-primary"
                    />
                    <span>
                      <span className="block font-display text-2xl leading-none font-extrabold">{d.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {full ? "Full" : d.left !== null ? `${d.left} slots left` : "Open"}
                      </span>
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums">{formatPeso(d.price)}</span>
                </label>
              );
            })}
          </div>
        </Step>

        <Step n={2} title="Pick your shirt size" error={err.tshirtSize}>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <label
                key={s}
                className="flex h-11 min-w-14 cursor-pointer items-center justify-center rounded-lg border border-input bg-background px-3 font-display text-lg font-bold has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
              >
                <input type="radio" name="tshirtSize" value={s} className="sr-only" />
                {s}
              </label>
            ))}
          </div>
        </Step>

        <Step n={3} title="Your details" description="Saved to your profile so you don't have to type them again.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mobile number" error={err.phone}>
              <Input name="phone" type="tel" autoComplete="tel" defaultValue={profile?.phone ?? ""} aria-invalid={!!err.phone || undefined} />
            </Field>
            <Field label="Birthdate" error={err.birthdate}>
              <Input name="birthdate" type="date" defaultValue={profile?.birthdate ?? ""} aria-invalid={!!err.birthdate || undefined} />
            </Field>
            <Field label="Gender" error={err.gender}>
              <select
                name="gender"
                defaultValue={profile?.gender ?? ""}
                aria-invalid={!!err.gender || undefined}
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
              >
                <option value="" disabled>
                  Choose…
                </option>
                {GENDERS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </Field>
            <div className="hidden sm:block" />
            <Field label="Emergency contact name" error={err.emergencyName}>
              <Input name="emergencyName" defaultValue={profile?.emergencyName ?? ""} aria-invalid={!!err.emergencyName || undefined} />
            </Field>
            <Field label="Emergency contact number" error={err.emergencyPhone}>
              <Input
                name="emergencyPhone"
                type="tel"
                defaultValue={profile?.emergencyPhone ?? ""}
                aria-invalid={!!err.emergencyPhone || undefined}
              />
            </Field>
          </div>
        </Step>

        <Step n={4} title="Pay and upload your receipt">
          <div className="grid gap-4">
            <div className="rounded-lg bg-muted/60 p-4">
              <p className="text-sm text-muted-foreground">Amount to pay</p>
              <p className="font-display text-3xl font-extrabold tabular-nums">
                {selected ? formatPeso(selected.price) : "Pick a distance first"}
              </p>
              <PaymentDetails info={event} className="mt-3" />
            </div>
            <Field label="Reference number" hint="Optional. The GCash or bank reference on your receipt." error={err.referenceNo} className="sm:max-w-sm">
              <Input name="referenceNo" maxLength={100} />
            </Field>
            <ReceiptPicker error={err.receiptKey} onBusyChange={setUploading} />
          </div>
        </Step>
      </div>

      <aside className="grid gap-4 rounded-lg bg-card p-5 ring-1 ring-border lg:sticky lg:top-6">
        <div>
          <p className="font-display text-2xl leading-tight font-bold">{event.title}</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" aria-hidden />
            {formatDate(event.eventDate)}
            {start && `, ${start}`}
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" aria-hidden />
            {event.location}
          </p>
        </div>
        <div className="flex items-baseline justify-between border-t pt-4">
          <span className="text-muted-foreground">{selected ? selected.label : "Distance"}</span>
          <span className="font-display text-2xl font-extrabold tabular-nums">{selected ? formatPeso(selected.price) : "—"}</span>
        </div>
        {state.error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}
        <Button type="submit" size="lg" className="h-11 text-base" disabled={pending || uploading}>
          {pending ? "Submitting…" : "Submit registration"}
        </Button>
        <p className="text-sm text-muted-foreground">
          The organizer checks your receipt. Your bib number shows up in My Bookings once it&apos;s approved.
        </p>
      </aside>
    </form>
  );
}

function Step({ n, title, description, error, children }: { n: number; title: string; description?: string; error?: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-4 rounded-lg bg-card p-5 ring-1 ring-border md:p-6">
      <legend className="sr-only">{title}</legend>
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary font-display text-lg font-extrabold text-primary-foreground" aria-hidden>
          {n}
        </span>
        <div>
          <h2 className="font-display text-2xl leading-8 font-bold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </fieldset>
  );
}

function Field({ label, hint, error, className, children }: { label: string; hint?: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="text-sm text-destructive">{error}</span> : hint ? <span className="text-sm text-muted-foreground">{hint}</span> : null}
    </label>
  );
}
