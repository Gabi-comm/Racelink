"use client";

import { useActionState, useId, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordChecklist } from "@/components/password-checklist";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import { safeNext } from "@/lib/roles";
import { logIn, signUp, type AuthState } from "./actions";

type Props = { next: string };

// full page /login
export function AuthForm(props: Props) {
  return (
    <Card className="w-full max-w-sm">
      <CardContent>
        <AuthPanel {...props} />
      </CardContent>
    </Card>
  );
}

// shared ng page at popup
export function AuthPanel(props: Props) {
  // basa sa url mismo, minsan luma ang server content pag reused ang route
  const params = useSearchParams();
  const next = params.has("next") ? safeNext(params.get("next")) : props.next;
  const tab = params.get("tab") === "signup" ? "signup" : "login";
  return (
    <Tabs key={tab} defaultValue={tab} className="gap-5">
      <TabsList className="w-full">
        <TabsTrigger value="login">Log In</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>
      <AutoHeight>
        <TabsContent value="login" className={PANEL}>
          <LogInForm next={next} />
        </TabsContent>
        <TabsContent value="signup" className={PANEL}>
          <SignUpForm next={next} />
        </TabsContent>
      </AutoHeight>
    </Tabs>
  );
}

const PANEL =
  "animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ease-out data-ending-style:hidden motion-reduce:animate-none";

// smooth na height kapag nagpalit ng tab o may error
function AutoHeight({ children }: { children: ReactNode }) {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      style={{ height }}
      className="-m-1 overflow-hidden transition-[height] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
    >
      <div ref={inner} className="p-1">
        {children}
      </div>
    </div>
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
      <NewPasswordField error={state.fieldErrors?.password} />
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

// password field with the live requirement list under it
function NewPasswordField({ error }: { error?: string }) {
  const [value, setValue] = useState("");
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>Password</Label>
      <Input
        id={id}
        name="password"
        type="password"
        autoComplete="new-password"
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-rules${error ? ` ${id}-error` : ""}`}
      />
      <PasswordChecklist id={`${id}-rules`} value={value} />
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
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
