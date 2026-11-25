"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FormError, NewPasswordField } from "../login/auth-form";
import { resetPassword, type AuthState } from "../login/actions";

export function ResetForm({ token }: { token: string | null }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(resetPassword, {});

  // link expired, already used, or opened without a token
  if (!token) {
    return (
      <div className="grid gap-4">
        <div className="grid gap-1">
          <CardTitle>This link has expired</CardTitle>
          <CardDescription>Reset links work once and only for 1 hour. Ask for a new one from the log in screen.</CardDescription>
        </div>
        <Link href="/login" className={buttonVariants({ size: "lg" })}>
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-4" noValidate>
      <div className="grid gap-1">
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>You&apos;ll be logged out on every other device after this.</CardDescription>
      </div>
      <input type="hidden" name="token" value={token} />
      <NewPasswordField error={state.fieldErrors?.password} />
      <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" error={state.fieldErrors?.confirm} />
      <FormError message={state.error} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}
