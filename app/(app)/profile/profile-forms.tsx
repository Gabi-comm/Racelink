"use client";

import { useActionState, useEffect, useRef, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GENDERS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { changePassword, saveDetails, saveName, type ProfileState } from "./actions";

type Action = (prev: ProfileState, form: FormData) => Promise<ProfileState>;

function useForm(action: Action, resetOnOk = false) {
  const [state, formAction] = useActionState<ProfileState, FormData>(action, {});
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.ok) return;
    toast.success(state.ok);
    if (resetOnOk) ref.current?.reset();
  }, [state, resetOnOk]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  }
  return { state, pending, ref, onSubmit, err: state.fieldErrors ?? {} };
}

export function NameForm({ name, email }: { name: string; email: string }) {
  const { state, pending, ref, onSubmit, err } = useForm(saveName);
  return (
    <form ref={ref} onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Full name" error={err.name}>
        <Input name="name" defaultValue={name} autoComplete="name" aria-invalid={!!err.name || undefined} />
      </Field>
      <Field label="Email" hint="Your login email can't be changed here.">
        <Input value={email} readOnly disabled />
      </Field>
      <Footer pending={pending} error={state.error} label="Save name" />
    </form>
  );
}

type Profile = {
  phone: string | null;
  address: string | null;
  gender: string | null;
  birthdate: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
} | null;

export function DetailsForm({ profile }: { profile: Profile }) {
  const { state, pending, ref, onSubmit, err } = useForm(saveDetails);
  return (
    <form ref={ref} onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
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
      <Field label="Address" hint="Optional. City is enough." error={err.address}>
        <Input name="address" autoComplete="address-level2" defaultValue={profile?.address ?? ""} aria-invalid={!!err.address || undefined} />
      </Field>
      <Field label="Emergency contact name" error={err.emergencyName}>
        <Input name="emergencyName" defaultValue={profile?.emergencyName ?? ""} aria-invalid={!!err.emergencyName || undefined} />
      </Field>
      <Field label="Emergency contact number" error={err.emergencyPhone}>
        <Input name="emergencyPhone" type="tel" defaultValue={profile?.emergencyPhone ?? ""} aria-invalid={!!err.emergencyPhone || undefined} />
      </Field>
      <Footer pending={pending} error={state.error} label="Save details" />
    </form>
  );
}

export function PasswordForm() {
  const { state, pending, ref, onSubmit, err } = useForm(changePassword, true);
  return (
    <form ref={ref} onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Current password" error={err.currentPassword} className="sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">
        <Input name="currentPassword" type="password" autoComplete="current-password" aria-invalid={!!err.currentPassword || undefined} />
      </Field>
      <Field label="New password" hint="At least 8 characters." error={err.newPassword}>
        <Input name="newPassword" type="password" autoComplete="new-password" aria-invalid={!!err.newPassword || undefined} />
      </Field>
      <Field label="Confirm new password" error={err.confirm}>
        <Input name="confirm" type="password" autoComplete="new-password" aria-invalid={!!err.confirm || undefined} />
      </Field>
      <Footer pending={pending} error={state.error} label="Change password" />
    </form>
  );
}

function Footer({ pending, error, label }: { pending: boolean; error?: string; label: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : label}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function Field({ label, hint, error, className, children }: { label: string; hint?: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <label className={cn("grid content-start gap-1.5", className)}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="text-sm text-destructive">{error}</span> : hint ? <span className="text-sm text-muted-foreground">{hint}</span> : null}
    </label>
  );
}
