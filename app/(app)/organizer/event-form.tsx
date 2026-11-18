"use client";

import { useActionState, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { EVENT_STATUS_LABEL, EVENT_STATUSES, TSHIRT_SIZES, type EventStatus, type TshirtSize } from "@/lib/constants";
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
  paymentInstructions: string | null;
  status: EventStatus;
  bannerKey: string | null;
  distances: { id: number; label: string; price: number; slots: number | null }[];
  sizes: TshirtSize[];
};

type Row = { key: number; id: string; label: string; price: string; slots: string };

const STATUS_HINT: Record<EventStatus, string> = {
  draft: "Only you can see it.",
  open: "Listed on the home page and taking registrations.",
  closed: "Listed, but not taking new registrations.",
  cancelled: "Hidden from the home page. Runners see it as cancelled.",
};

let nextKey = 1;

export function EventForm({ event, bannerUrl }: { event?: EventFormValues; bannerUrl?: string | null }) {
  const [state, formAction] = useActionState<EventFormState, FormData>(saveEvent, {});
  const [pending, startTransition] = useTransition();
  const err = state.fieldErrors ?? {};

  const [rows, setRows] = useState<Row[]>(() =>
    event?.distances.length
      ? event.distances.map((d) => ({ key: nextKey++, id: String(d.id), label: d.label, price: String(d.price), slots: d.slots ? String(d.slots) : "" }))
      : [{ key: nextKey++, id: "", label: "5KM", price: "", slots: "" }],
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
              <Input
                name="distanceLabel"
                aria-label={`Distance ${i + 1}`}
                list="race-lengths"
                value={r.label}
                onChange={(e) => updateRow(r.key, { label: e.target.value })}
                aria-invalid={!!err[`distances.${i}.label`] || undefined}
              />
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
          <datalist id="race-lengths">
            {RACE_LENGTHS.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
          {err.distances && <p className="text-sm text-destructive">{err.distances}</p>}
          <Button
            type="button"
            variant="outline"
            className="justify-self-start"
            onClick={() => setRows((rs) => [...rs, { key: nextKey++, id: "", label: "", price: "", slots: "" }])}
          >
            <Plus aria-hidden /> Add distance
          </Button>
        </div>
      </Section>

      <Section title="Payment" description="Shown to runners when they register, before they upload their receipt.">
        <Field label="How to pay" hint="GCash or bank details, the account name, and what to write in the message." error={err.paymentInstructions}>
          <Textarea
            name="paymentInstructions"
            defaultValue={event?.paymentInstructions ?? ""}
            rows={4}
            maxLength={2000}
            placeholder={"GCash: 0917 123 4567 (Juan Dela Cruz)\nPut your full name in the message."}
            aria-invalid={!!err.paymentInstructions || undefined}
          />
        </Field>
      </Section>

      <Section title="Shirt sizes" description="Runners pick one when they register.">
        <fieldset aria-invalid={!!err.sizes || undefined}>
          <legend className="sr-only">Shirt sizes</legend>
          <div className="flex flex-wrap gap-2">
            {TSHIRT_SIZES.map((s) => (
              <label
                key={s}
                className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 font-display text-base font-bold has-checked:border-primary has-checked:bg-primary/10 has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
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
              className="flex cursor-pointer gap-3 rounded-lg border border-input bg-background p-3 has-checked:border-primary has-checked:bg-primary/5 has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
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
