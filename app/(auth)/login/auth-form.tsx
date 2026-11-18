"use client";

import { useActionState, useId, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logIn, signUp, type AuthState } from "./actions";

type Props = { next: string; initialTab: "login" | "signup" };

export function AuthForm({ next, initialTab }: Props) {
  return (
    <Card className="w-full max-w-sm">
      <Tabs defaultValue={initialTab}>
        <CardHeader>
          <TabsList className="w-full">
            <TabsTrigger value="login">Log In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent>
          <TabsContent value="login">
            <LogInForm next={next} />
          </TabsContent>
          <TabsContent value="signup">
            <SignUpForm next={next} />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}

function LogInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(logIn, {});
  return (
    <form action={action} className="grid gap-4" noValidate>
      <div className="grid gap-1">
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Log in to manage your race registrations.</CardDescription>
      </div>
      <input type="hidden" name="next" value={next} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        error={state.fieldErrors?.password}
      />
      <FormError message={state.error} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Logging in…" : "Log In"}
      </Button>
    </form>
  );
}

function SignUpForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, {});
  return (
    <form action={action} className="grid gap-4" noValidate>
      <div className="grid gap-1">
        <CardTitle>Create your runner account</CardTitle>
        <CardDescription>Sign up to register for races and track your bib.</CardDescription>
      </div>
      <input type="hidden" name="next" value={next} />
      <Field
        label="Full name"
        name="name"
        autoComplete="name"
        defaultValue={state.values?.name}
        error={state.fieldErrors?.name}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters."
        error={state.fieldErrors?.password}
      />
      <Field
        label="Confirm password"
        name="confirm"
        type="password"
        autoComplete="new-password"
        error={state.fieldErrors?.confirm}
      />
      <FormError message={state.error} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Creating account…" : "Create Account"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  hint,
  ...props
}: ComponentProps<typeof Input> & { label: string; name: string; error?: string; hint?: string }) {
  const id = `${useId()}-${name}`;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        key={String(props.defaultValue ?? "")}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  );
}
