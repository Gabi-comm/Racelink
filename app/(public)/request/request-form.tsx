"use client";

import { useActionState, useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, Info, MessageCircle, Plus, X } from "lucide-react";
import { Typed, t } from "@/components/landing/demo-kit";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { RaceRequestField, RaceRequestState } from "@/lib/request-form";
import { submitRaceRequest } from "./actions";

// contact details carry over to the next request, so another race only needs its own details
const CARRY: RaceRequestField[] = ["organization", "contactName", "email", "phone"];
type Prefill = Partial<Record<RaceRequestField, string>>;

export function RequestForm({ minDate }: { minDate: string }) {
  // bumping the round remounts the form with a fresh action state ("Send another request")
  const [round, setRound] = useState(0);
  const [prefill, setPrefill] = useState<Prefill>({});
  return (
    <RequestFormRound
      key={round}
      minDate={minDate}
      prefill={prefill}
      onAnother={(last) => {
        setPrefill(last);
        setRound((r) => r + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    />
  );
}

function RequestFormRound({
  minDate,
  prefill,
  onAnother,
}: {
  minDate: string;
  prefill: Prefill;
  onAnother: (last: Prefill) => void;
}) {
  const [state, action, pending] = useActionState<RaceRequestState, FormData>(submitRaceRequest, {});
  const last = useRef<Prefill>({});

  if (state.ok) {
    return (
      <div role="status" className="demo-in grid justify-items-start gap-3 rounded-xl bg-card p-8 ring-1 ring-border">
        <CheckCircle2 className="size-8 text-success" aria-hidden />
        <h2 className="font-display text-2xl font-bold">Request sent</h2>
        <p className="max-w-prose text-muted-foreground">
          Thanks. An organizer will review your request and get in touch through the email you gave us, usually within a few
          working days. If it&apos;s approved, they&apos;ll set up the race and open registration on RaceLink.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Button type="button" size="lg" className="h-11 gap-1.5 px-5" onClick={() => onAnother(last.current)}>
            <Plus className="size-4" aria-hidden /> Send another request
          </Button>
          <Link href="/" className={buttonVariants({ variant: "outline", size: "lg", className: "h-11 px-5" })}>
            Back to home
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">Your organization and contact details stay filled in.</p>
      </div>
    );
  }

  const v: Prefill = state.values ?? prefill;
  const err = state.fieldErrors ?? {};
  const field = (name: RaceRequestField) => ({ name, defaultValue: v[name], error: err[name] });

  return (
    <form
      action={action}
      onSubmit={(e) => {
        const data = new FormData(e.currentTarget);
        last.current = Object.fromEntries(CARRY.map((k) => [k, String(data.get(k) ?? "")]));
      }}
      noValidate
      className="grid gap-8 rounded-xl bg-card p-6 ring-1 ring-border md:p-8"
    >
      {/* honeypot, hidden from people */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Fieldset legend="Your organization">
        <Field label="Organization" {...field("organization")} autoComplete="organization" className="sm:col-span-2" />
        <Field label="Contact person" {...field("contactName")} autoComplete="name" />
        <Field label="Email" type="email" {...field("email")} autoComplete="email" />
        <Field label="Phone" type="tel" {...field("phone")} autoComplete="tel" optional />
      </Fieldset>

      <Fieldset legend="The race">
        <Field label="Race name" {...field("raceTitle")} className="sm:col-span-2" />
        <Field label="Preferred date" type="date" min={minDate} {...field("proposedDate")} />
        <Field label="Expected runners" type="number" inputMode="numeric" min={1} {...field("expectedRunners")} optional />
        <Field label="Location" {...field("location")} className="sm:col-span-2" />
        <Field label="Distances" {...field("distances")} optional className="sm:col-span-2" />
        <TextField label="Anything else we should know" {...field("message")} />
      </Fieldset>

      {state.error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={pending} className="h-11 px-6 text-base">
          {pending ? "Sending…" : "Send request"}
        </Button>
      </div>
    </form>
  );
}

// what each field is for, plus an example that types itself out when the guide opens
const GUIDES: Record<RaceRequestField, { tip: string; example: string }> = {
  organization: { tip: "The school, barangay, company or club that is hosting the run.", example: "UE Caloocan Student Council" },
  contactName: { tip: "The person an organizer should talk to about this race.", example: "Janessa Manuel" },
  email: { tip: "We reply to your request here, so use an inbox you check often.", example: "janessa.manuel@example.com" },
  phone: { tip: "Optional. Useful for quick questions while the race is being set up.", example: "0917 123 4567" },
  raceTitle: { tip: "What the race should be called. You can still change it before registration opens.", example: "UE Warriors Fun Run" },
  proposedDate: { tip: "The day you'd like to hold the race. It has to be a future date.", example: "Sunday, July 12, 2027" },
  expectedRunners: { tip: "A rough guess is fine. It becomes the race's starting number of slots.", example: "500" },
  location: { tip: "The city or venue runners will recognize, plus the start area if you know it.", example: "UE Caloocan campus and 5th Ave" },
  distances: { tip: "The distances you want to offer, separated by commas.", example: "3K, 5K, 10K" },
  message: { tip: "Anything that helps the organizer: the purpose of the run, sponsors, or permits you already have.", example: "Fundraiser for the student scholarship fund." },
};

function FieldLabel({ id, name, label, optional }: { id: string; name: RaceRequestField; label: string; optional?: boolean }) {
  const [open, setOpen] = useState(false);
  const [plays, setPlays] = useState(0);
  const [below, setBelow] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const guide = GUIDES[name];

  // close like a chat popup: click outside or press Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative flex items-center gap-1.5">
      <Label htmlFor={id}>
        {/* one text run so "(optional)" wraps with the label instead of floating right */}
        <span>
          {label}
          {optional && <span className="font-normal text-muted-foreground"> (optional)</span>}
        </span>
      </Label>
      <button
        type="button"
        onClick={(e) => {
          // open upward like a chat bubble, unless the sticky header would cover it
          setBelow(e.currentTarget.getBoundingClientRect().top < 300);
          setOpen((o) => !o);
          setPlays((n) => n + 1);
        }}
        aria-expanded={open}
        aria-controls={`${id}-guide`}
        className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:text-primary"
      >
        <Info className="size-4" aria-hidden />
        <span className="sr-only">How to fill in {label}</span>
      </button>

      {open && (
        <div
          key={plays}
          id={`${id}-guide`}
          role="status"
          className={`demo-pop absolute left-0 z-30 w-[21rem] max-w-full sm:max-w-none rounded-2xl border bg-popover p-3 text-popover-foreground shadow-xl ${
            below ? "top-full mt-2 origin-top-left rounded-tl-sm" : "bottom-full mb-2 origin-bottom-left rounded-bl-sm"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <MessageCircle className="size-3.5" aria-hidden />
            </span>
            <p className="text-xs font-semibold">RaceLink guide</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto inline-flex size-6 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <X className="size-3.5" aria-hidden />
              <span className="sr-only">Close guide</span>
            </button>
          </div>

          <div className="mt-2.5 grid grid-cols-[minmax(0,1fr)] justify-items-start gap-1.5 pl-9">
            {/* "typing..." dots, then the messages */}
            <span aria-hidden className="demo-out absolute mt-1 inline-flex gap-1 rounded-2xl rounded-tl-sm bg-muted px-3 py-2.5" style={t(0.75)}>
              <span className="chat-dot size-1.5 rounded-full bg-muted-foreground" />
              <span className="chat-dot size-1.5 rounded-full bg-muted-foreground [animation-delay:0.15s]" />
              <span className="chat-dot size-1.5 rounded-full bg-muted-foreground [animation-delay:0.3s]" />
            </span>
            <p className="demo-in max-w-full rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm leading-snug break-words" style={t(0.8)}>
              {guide.tip}
            </p>
            <p className="demo-in max-w-full rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-xs text-muted-foreground" style={t(1.25)}>
              Example:{" "}
              <Typed
                text={guide.example}
                at={1.45}
                len={Math.min(1.4, 0.04 * guide.example.length + 0.2)}
                wrap
                className="align-bottom font-semibold break-words text-foreground"
              />
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Fieldset({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-4">
      <legend className="mb-4 font-display text-lg font-bold">{legend}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

type FieldProps = {
  label: string;
  name: RaceRequestField;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  defaultValue?: string;
};

function useDescribed(name: string, error?: string, hint?: string) {
  const id = `${useId()}-${name}`;
  return { id, describedBy: error ? `${id}-error` : hint ? `${id}-hint` : undefined };
}

function Help({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error)
    return (
      <p id={`${id}-error`} className="text-sm text-destructive">
        {error}
      </p>
    );
  if (hint)
    return (
      <p id={`${id}-hint`} className="text-sm text-muted-foreground">
        {hint}
      </p>
    );
  return null;
}

function Field({
  label,
  name,
  error,
  hint,
  optional,
  className,
  defaultValue,
  ...props
}: FieldProps & Omit<ComponentProps<typeof Input>, "name" | "defaultValue">) {
  const { id, describedBy } = useDescribed(name, error, hint);
  return (
    <div className={`grid content-start gap-1.5 ${className ?? ""}`}>
      <FieldLabel id={id} name={name} label={label} optional={optional} />
      <Input
        id={id}
        name={name}
        required={!optional}
        defaultValue={defaultValue}
        key={defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="h-10"
        {...props}
      />
      <Help id={id} error={error} hint={hint} />
    </div>
  );
}

function TextField({ label, name, error, hint, defaultValue }: FieldProps) {
  const { id, describedBy } = useDescribed(name, error, hint);
  return (
    <div className="grid gap-1.5 sm:col-span-2">
      <FieldLabel id={id} name={name} label={label} optional />
      <Textarea
        id={id}
        name={name}
        rows={4}
        defaultValue={defaultValue}
        key={defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="min-h-28"
      />
      <Help id={id} error={error} hint={hint} />
    </div>
  );
}
