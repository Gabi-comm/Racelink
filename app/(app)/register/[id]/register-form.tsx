"use client";

import { useActionState, useState, useTransition, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
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
  const [size, setSize] = useState<string | null>(null);
  const selected = distances.find((d) => d.id === distanceId);
  const start = formatTime(event.startTime);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6">
      <div className="border-b pb-6">
        <p className="text-xs font-semibold tracking-[0.2em] text-link uppercase">Race registration</p>
        <h1 className="mt-1 font-[family-name:var(--font-oswald)] text-3xl font-bold">{event.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Registering as {runnerName}.</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_24rem] lg:gap-10">
        <div className="grid gap-5">
          <Step n={1} title="Pick your distance" error={err.distanceId}>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {distances.map((d) => {
                const full = d.left === 0;
                return (
                  <label
                    key={d.id}
                    className={cn(
                      "grid cursor-pointer gap-1 rounded-xl border bg-card p-4 transition-colors hover:border-brand-light/60 has-checked:border-brand-light has-checked:bg-muted/70 has-checked:ring-1 has-checked:ring-brand-light has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                      full && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <input
                      type="radio"
                      name="distanceId"
                      value={d.id}
                      disabled={full}
                      checked={distanceId === d.id}
                      onChange={() => setDistanceId(d.id)}
                      className="sr-only"
                    />
                    <span className="font-[family-name:var(--font-oswald)] text-2xl leading-none font-bold uppercase">{d.label}</span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      {full ? "Full" : d.left !== null ? `${d.left} slots left` : (start ?? "Open")}
                    </span>
                    <span className="mt-1 text-sm font-bold tabular-nums">{formatPeso(d.price)}</span>
                  </label>
                );
              })}
            </div>
          </Step>

          <Step n={2} title="Pick shirt size" error={err.tshirtSize}>
            <div className="flex flex-wrap gap-2.5">
              {sizes.map((s) => (
                <label
                  key={s}
                  className="flex h-12 min-w-14 cursor-pointer items-center justify-center rounded-lg border bg-card px-3 text-sm font-bold transition-colors hover:border-brand-light/60 has-checked:border-brand-light has-checked:bg-muted/70 has-checked:ring-1 has-checked:ring-brand-light has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
                >
                  <input type="radio" name="tshirtSize" value={s} checked={size === s} onChange={() => setSize(s)} className="sr-only" />
                  {s}
                </label>
              ))}
            </div>
          </Step>

          <Step n={3} title="Your details" description="Saved to your profile so you don&apos;t have to type them again.">
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <Field label="Mobile number" error={err.phone}>
                <Input name="phone" type="tel" autoComplete="tel" placeholder="+63 917 000 0000" defaultValue={profile?.phone ?? ""} aria-invalid={!!err.phone || undefined} className={INPUT} />
              </Field>
              <Field label="Birthdate" error={err.birthdate}>
                <Input name="birthdate" type="date" defaultValue={profile?.birthdate ?? ""} aria-invalid={!!err.birthdate || undefined} className={INPUT} />
              </Field>
              <Field label="Gender" error={err.gender}>
                <select
                  name="gender"
                  defaultValue={profile?.gender ?? ""}
                  aria-invalid={!!err.gender || undefined}
                  className={cn(INPUT, "w-full border border-input bg-transparent outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive")}
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
                <Input name="emergencyName" placeholder="Full name" defaultValue={profile?.emergencyName ?? ""} aria-invalid={!!err.emergencyName || undefined} className={INPUT} />
              </Field>
              <Field label="Emergency contact number" error={err.emergencyPhone}>
                <Input
                  name="emergencyPhone"
                  type="tel"
                  placeholder="+63 917 000 0000"
                  defaultValue={profile?.emergencyPhone ?? ""}
                  aria-invalid={!!err.emergencyPhone || undefined}
                  className={INPUT}
                />
              </Field>
            </div>
          </Step>

          <Step n={4} title="Pay and upload receipt">
            <div className="grid gap-4">
              <div className="rounded-xl bg-muted/60 p-4">
                <p className="text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">Amount to pay</p>
                <p className="mt-1 font-[family-name:var(--font-oswald)] text-3xl font-bold tabular-nums">
                  {selected ? formatPeso(selected.price) : "Pick a distance first"}
                </p>
                <PaymentDetails info={event} className="mt-3" />
              </div>
              <Field label="Reference number" hint="Optional. The GCash or bank reference on your receipt." error={err.referenceNo} className="sm:max-w-sm">
                <Input name="referenceNo" maxLength={100} className={INPUT} />
              </Field>
              <ReceiptPicker error={err.receiptKey} onBusyChange={setUploading} />
            </div>
          </Step>
        </div>

        <aside className="dark grid gap-6 rounded-2xl bg-[#172340] p-7 text-foreground lg:sticky lg:top-24">
          <div>
            <span className="inline-flex items-center rounded-full bg-marking px-3 py-1 text-[0.7rem] font-bold tracking-[0.12em] text-marking-foreground uppercase">
              Event summary
            </span>
            <p className="mt-5 font-[family-name:var(--font-oswald)] text-4xl leading-[1.05] font-bold uppercase">{event.title}</p>
          </div>
          <dl className="divide-y divide-white/10 text-sm">
            <SummaryRow label="Date" value={formatDate(event.eventDate, "short") + (start ? ` · ${start}` : "")} />
            <SummaryRow label="Location" value={event.location} />
            <SummaryRow label="Category" value={selected?.label ?? "—"} />
            <SummaryRow label="Shirt size" value={size ?? "—"} />
          </dl>
          <div className="flex items-end justify-between gap-4">
            <span className="text-xs font-semibold tracking-[0.12em] text-marking uppercase">Total fee</span>
            <span className="font-[family-name:var(--font-oswald)] text-5xl leading-none font-bold tabular-nums">{selected ? formatPeso(selected.price) : "—"}</span>
          </div>
          {state.error && (
            <p role="alert" className="rounded-lg bg-destructive/20 px-3 py-2 text-sm text-red-200">
              {state.error}
            </p>
          )}
          <div className="grid gap-3">
            <Button type="submit" size="lg" className="h-14 gap-2 rounded-xl text-base" disabled={pending || uploading}>
              {pending ? "Submitting…" : "Submit registration"} <ArrowRight className="size-4" aria-hidden />
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              By submitting, you agree to the event terms and waiver. Your bib shows up in My Bookings once the organizer approves your receipt.
            </p>
          </div>
        </aside>
      </div>
    </form>
  );
}

const INPUT = "h-12 rounded-xl px-4 text-base md:text-sm";

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-bold">{value}</dd>
    </div>
  );
}

function Step({ n, title, description, error, children }: { n: number; title: string; description?: string; error?: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-5 rounded-2xl bg-card p-5 ring-1 ring-border md:grid-cols-[3rem_1fr] md:gap-x-6 md:p-8">
      <legend className="sr-only">{title}</legend>
      <span
        className="grid size-11 place-items-center rounded-xl bg-brand-light font-[family-name:var(--font-oswald)] text-xl font-bold text-white"
        aria-hidden
      >
        {String(n).padStart(2, "0")}
      </span>
      <div className="self-center">
        <h2 className="font-[family-name:var(--font-oswald)] text-3xl leading-tight font-bold uppercase">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="grid gap-3 md:col-start-2">
        {children}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </fieldset>
  );
}

function Field({ label, hint, error, className, children }: { label: string; hint?: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span className="text-sm font-semibold">{label}</span>
      {children}
      {error ? <span className="text-sm text-destructive">{error}</span> : hint ? <span className="text-sm text-muted-foreground">{hint}</span> : null}
    </label>
  );
}
