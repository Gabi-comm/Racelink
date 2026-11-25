"use client";

import { useActionState, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  EVENT_STATUS_LABEL,
  EVENT_STATUSES,
  PAYMENT_METHOD_LABEL,
  PAYMENT_METHODS,
  TSHIRT_SIZES,
  type EventStatus,
  type PaymentMethod,
  type TshirtSize,
} from "@/lib/constants";
import { RACE_LENGTHS, type EventFormState } from "@/lib/event-form";
import { uploadFile } from "@/lib/upload-client";
import { UPLOAD_KINDS } from "@/lib/uploads";
import { saveEvent } from "./actions";

export type EventFormValues = {
  id: number;
  title: string;
  description: string;
  location: string;
  eventDate: string;
  startTime: string | null;
  registrationCloses: string | null;
  capacity: number | null;
  paymentMethod: PaymentMethod | null;
  paymentBank: string | null;
  paymentAccountName: string | null;
  paymentAccountNumber: string | null;
  paymentInstructions: string | null;
  status: EventStatus;
  bannerKey: string | null;
  requestedBy: string | null;
  distances: { id: number; label: string; price: number; slots: number | null }[];
  sizes: TshirtSize[];
};

// custom = organizer nag-type ng sariling km
type Row = { key: number; id: string; label: string; custom: boolean; km: string; price: string; slots: string };

const CUSTOM = "custom";

function toRow(d: { id?: number; label: string; price?: number; slots?: number | null }): Row {
  const custom = d.label !== "" && !RACE_LENGTHS.includes(d.label);
  return {
    key: nextKey++,
    id: d.id ? String(d.id) : "",
    label: custom ? "" : d.label,
    custom,
    km: custom ? String(parseFloat(d.label) || "") : "",
    price: d.price !== undefined ? String(d.price) : "",
    slots: d.slots ? String(d.slots) : "",
  };
}

const rowLabel = (r: Row) => (r.custom ? (r.km.trim() ? `${r.km.trim()}KM` : "") : r.label);

const SELECT =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

const STATUS_HINT: Record<EventStatus, string> = {
  draft: "Only you can see it.",
  open: "Listed for runners and taking registrations.",
  closed: "Listed, but not taking new registrations.",
  cancelled: "Hidden from the race list. Runners see it as cancelled.",
};

let nextKey = 1;

export function EventForm({ event, bannerUrl }: { event?: EventFormValues; bannerUrl?: string | null }) {
  const [state, formAction] = useActionState<EventFormState, FormData>(saveEvent, {});
  const [pending, startTransition] = useTransition();
  const err = state.fieldErrors ?? {};

  const [rows, setRows] = useState<Row[]>(() =>
    event?.distances.length ? event.distances.map(toRow) : [toRow({ label: "5KM" })],
  );
  const [status, setStatus] = useState<EventStatus>(event?.status ?? "draft");

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  // manual submit para hindi ma-reset yung form kapag may error
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-8">
      {event && <input type="hidden" name="id" value={event.id} />}

      <Section title="Race details">
        <Field label="Race name" error={err.title}>
          <Input name="title" defaultValue={event?.title} maxLength={150} required aria-invalid={!!err.title || undefined} />
        </Field>
        <Field
          label="Requested by"
          hint="Optional. The organization that asked for this race, like a school, barangay or company."
          error={err.requestedBy}
        >
          <Input name="requestedBy" defaultValue={event?.requestedBy ?? ""} maxLength={150} aria-invalid={!!err.requestedBy || undefined} />
        </Field>
        <Field label="Where" hint="City or venue runners will recognize, like Roxas Blvd, Manila." error={err.location}>
          <Input name="location" defaultValue={event?.location} maxLength={255} required aria-invalid={!!err.location || undefined} />
        </Field>
        <Field label="Description" hint="Course, inclusions, and anything runners should know." error={err.description}>
          <Textarea
            name="description"
            defaultValue={event?.description}
            rows={5}
            maxLength={5000}
            required
            aria-invalid={!!err.description || undefined}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Race day" error={err.eventDate}>
            <Input type="date" name="eventDate" defaultValue={event?.eventDate} required aria-invalid={!!err.eventDate || undefined} />
          </Field>
          <Field label="Gun start" hint="Optional" error={err.startTime}>
            <Input type="time" name="startTime" defaultValue={event?.startTime?.slice(0, 5) ?? ""} />
          </Field>
          <Field label="Registration closes" hint="Optional" error={err.registrationCloses}>
            <Input
              type="date"
              name="registrationCloses"
              defaultValue={event?.registrationCloses ?? ""}
              aria-invalid={!!err.registrationCloses || undefined}
            />
          </Field>
        </div>
        <Field label="Total runner cap" hint="Optional. Leave blank for no limit." error={err.capacity} className="sm:max-w-xs">
          <Input
            type="number"
            name="capacity"
            min={1}
            inputMode="numeric"
            defaultValue={event?.capacity ?? ""}
            aria-invalid={!!err.capacity || undefined}
          />
        </Field>
      </Section>

      <Section title="Distances and fees" description="Each distance needs a fee. Slots are optional.">
        <div className="grid gap-3">
          <div className="hidden grid-cols-[1fr_1fr_1fr_2.25rem] gap-3 text-sm font-medium sm:grid">
            <span>Distance</span>
            <span>Fee (₱)</span>
            <span>Slots</span>
          </div>
          {rows.map((r, i) => (
            <div key={r.key} className="grid gap-x-3 gap-y-1 sm:grid-cols-[1fr_1fr_1fr_2.25rem]">
              <input type="hidden" name="distanceId" value={r.id} />
              <input type="hidden" name="distanceLabel" value={rowLabel(r)} />
              <div className="flex min-w-0 gap-2">
                <select
                  aria-label={`Distance ${i + 1}`}
                  value={r.custom ? CUSTOM : r.label}
                  onChange={(e) =>
                    updateRow(r.key, e.target.value === CUSTOM ? { custom: true, label: "" } : { custom: false, label: e.target.value })
                  }
                  aria-invalid={!!err[`distances.${i}.label`] || undefined}
                  className={SELECT}
                >
                  <option value="" disabled>
                    Pick a distance
                  </option>
                  {RACE_LENGTHS.map((l) => (
                    <option key={l} value={l} disabled={rows.some((x) => x.key !== r.key && rowLabel(x) === l)}>
                      {l}
                    </option>
                  ))}
                  <option value={CUSTOM}>Custom distance</option>
                </select>
                {r.custom && (
                  <div className="relative w-28 shrink-0">
                    <Input
                      aria-label={`Custom distance ${i + 1} in kilometers`}
                      type="number"
                      min={0.1}
                      max={999}
                      step="0.1"
                      inputMode="decimal"
                      placeholder="15"
                      value={r.km}
                      onChange={(e) => updateRow(r.key, { km: e.target.value })}
                      aria-invalid={!!err[`distances.${i}.label`] || undefined}
                      className="pr-9"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-sm text-muted-foreground">
                      km
                    </span>
                  </div>
                )}
              </div>
              <Input
                name="distancePrice"
                aria-label={`Fee for distance ${i + 1}`}
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={r.price}
                onChange={(e) => updateRow(r.key, { price: e.target.value })}
                aria-invalid={!!err[`distances.${i}.price`] || undefined}
              />
              <Input
                name="distanceSlots"
                aria-label={`Slots for distance ${i + 1}`}
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="No limit"
                value={r.slots}
                onChange={(e) => updateRow(r.key, { slots: e.target.value })}
                aria-invalid={!!err[`distances.${i}.slots`] || undefined}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9"
                aria-label={`Remove distance ${i + 1}`}
                disabled={rows.length === 1}
                onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
              >
                <Trash2 />
              </Button>
              {(err[`distances.${i}.label`] || err[`distances.${i}.price`] || err[`distances.${i}.slots`]) && (
                <p className="text-sm text-destructive sm:col-span-4">
                  {err[`distances.${i}.label`] ?? err[`distances.${i}.price`] ?? err[`distances.${i}.slots`]}
                </p>
              )}
            </div>
          ))}
          {err.distances && <p className="text-sm text-destructive">{err.distances}</p>}
          <Button
            type="button"
            variant="outline"
            className="justify-self-start"
            onClick={() => setRows((rs) => [...rs, toRow({ label: RACE_LENGTHS.find((l) => !rs.some((x) => rowLabel(x) === l)) ?? "" })])}
          >
            <Plus aria-hidden /> Add distance
          </Button>
        </div>
      </Section>

      <Section title="Payment" description="Shown to runners when they register, before they upload their receipt.">
        <PaymentFields event={event} err={err} />
      </Section>

      <Section title="Shirt sizes" description="Runners pick one when they register.">
        <fieldset aria-invalid={!!err.sizes || undefined}>
          <legend className="sr-only">Shirt sizes</legend>
          <div className="flex flex-wrap gap-2">
            {TSHIRT_SIZES.map((s) => (
              <label
                key={s}
                className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 font-display text-base font-bold has-checked:border-link has-checked:bg-primary/10 has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
              >
                <input
                  type="checkbox"
                  name="sizes"
                  value={s}
                  defaultChecked={event ? event.sizes.includes(s) : ["S", "M", "L", "XL"].includes(s)}
                  className="size-4 accent-primary"
                />
                {s}
              </label>
            ))}
          </div>
        </fieldset>
        {err.sizes && <p className="text-sm text-destructive">{err.sizes}</p>}
      </Section>

      <Section title="Banner image" description="Shown on the race details. Landscape images work best.">
        <BannerPicker initialKey={event?.bannerKey ?? null} initialUrl={bannerUrl ?? null} />
      </Section>

      <Section title="Visibility">
        <div className="grid gap-2 sm:grid-cols-2">
          {EVENT_STATUSES.map((s) => (
            <label
              key={s}
              className="flex cursor-pointer gap-3 rounded-lg border border-input bg-background p-3 has-checked:border-link has-checked:bg-primary/5 has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
            >
              <input
                type="radio"
                name="status"
                value={s}
                checked={status === s}
                onChange={() => setStatus(s)}
                className="mt-1 size-4 accent-primary"
              />
              <span>
                <span className="font-semibold">{EVENT_STATUS_LABEL[s]}</span>
                <span className="block text-sm text-muted-foreground">{STATUS_HINT[s]}</span>
              </span>
            </label>
          ))}
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t bg-background/95 px-4 py-4 backdrop-blur">
        {state.error && (
          <p role="alert" className="w-full text-sm font-medium text-destructive sm:w-auto sm:flex-1">
            {state.error}
          </p>
        )}
        <div className="ml-auto flex gap-2">
          <Link href="/organizer" className={buttonVariants({ variant: "outline", size: "lg", className: "h-10 px-4" })}>
            Cancel
          </Link>
          <Button type="submit" size="lg" className="h-10 px-5" disabled={pending}>
            {pending ? "Saving…" : event ? "Save changes" : "Create race"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function PaymentFields({ event, err }: { event?: EventFormValues; err: Record<string, string> }) {
  const [method, setMethod] = useState<PaymentMethod>(event?.paymentMethod ?? "gcash");
  const bank = method === "bank";
  return (
    <>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Payment method</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {PAYMENT_METHODS.map((m) => (
            <label
              key={m}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-input bg-background p-3 has-checked:border-link has-checked:bg-primary/5 has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
            >
              <input
                type="radio"
                name="paymentMethod"
                value={m}
                checked={method === m}
                onChange={() => setMethod(m)}
                className="size-4 accent-primary"
              />
              <span className="font-semibold">{PAYMENT_METHOD_LABEL[m]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {bank && (
        <Field label="Bank" hint="Like BPI, BDO or UnionBank." error={err.paymentBank} className="sm:max-w-xs">
          <Input name="paymentBank" defaultValue={event?.paymentBank ?? ""} maxLength={100} aria-invalid={!!err.paymentBank || undefined} />
        </Field>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Account name" error={err.paymentAccountName}>
          <Input
            name="paymentAccountName"
            defaultValue={event?.paymentAccountName ?? ""}
            maxLength={150}
            placeholder="Juan Dela Cruz"
            aria-invalid={!!err.paymentAccountName || undefined}
          />
        </Field>
        <Field label={bank ? "Account number" : "GCash number"} error={err.paymentAccountNumber}>
          <Input
            name="paymentAccountNumber"
            defaultValue={event?.paymentAccountNumber ?? ""}
            maxLength={40}
            inputMode="numeric"
            placeholder={bank ? "1234 5678 90" : "0917 123 4567"}
            aria-invalid={!!err.paymentAccountNumber || undefined}
          />
        </Field>
      </div>
      <Field label="Note for runners" hint="Optional. Like what to write in the payment message." error={err.paymentInstructions}>
        <Textarea
          name="paymentInstructions"
          defaultValue={event?.paymentInstructions ?? ""}
          rows={3}
          maxLength={2000}
          placeholder="Put your full name and the race in the payment message."
          aria-invalid={!!err.paymentInstructions || undefined}
        />
      </Field>
    </>
  );
}

function BannerPicker({ initialKey, initialUrl }: { initialKey: string | null; initialUrl: string | null }) {
  const [key, setKey] = useState(initialKey);
  const [preview, setPreview] = useState(initialUrl);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setError("");
    setUploading(true);
    const res = await uploadFile("banner", file);
    setUploading(false);
    if (input.current) input.current.value = "";
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setKey(res.key);
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="grid gap-3">
      <input type="hidden" name="bannerKey" value={key ?? ""} />
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Banner preview" className="aspect-[3/1] w-full rounded-lg object-cover ring-1 ring-border" />
      ) : (
        <div className="grid aspect-[3/1] w-full place-items-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
          No banner yet
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <label className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer", uploading && "pointer-events-none opacity-60")}>
          <ImagePlus aria-hidden />
          {uploading ? "Uploading…" : preview ? "Replace image" : "Upload image"}
          <input
            ref={input}
            type="file"
            accept={Object.keys(UPLOAD_KINDS.banner.types).join(",")}
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </label>
        {preview && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setKey(null);
              setPreview(null);
            }}
          >
            Remove
          </Button>
        )}
        <span className="text-sm text-muted-foreground">{UPLOAD_KINDS.banner.label}</span>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="grid gap-5 rounded-lg bg-card p-5 ring-1 ring-border md:grid-cols-[14rem_1fr] md:gap-8 md:p-6">
      <div>
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="grid min-w-0 gap-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? (
        <span className="text-sm text-destructive">{error}</span>
      ) : hint ? (
        <span className="text-sm text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}
