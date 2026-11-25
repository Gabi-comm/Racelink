"use client";

import { useActionState, useId, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordChecklist } from "@/components/password-checklist";
import { PASSWORD_RULES } from "@/lib/password";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import { safeNext } from "@/lib/roles";
import { MailCheck } from "lucide-react";
import { forgotPassword, logIn, signUp, type AuthState } from "./actions";

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
  // messages from the email links (verify / reset) that land back here
  const banner =
    params.get("reset") === "1"
      ? "Password updated. Log in with your new password."
      : params.get("verified") === "1" && params.get("error")
        ? "That verification link has expired or was already used. Log in and we'll send you a new one."
        : undefined;
  return (
    <Tabs key={tab} defaultValue={tab} className="gap-5">
      <TabsList className="w-full">
        <TabsTrigger value="login">Log In</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>
      <AutoHeight>
        <TabsContent value="login" className={PANEL}>
          <LogInSection next={next} banner={banner} />
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

// log in, or the forgot-password step in its place
function LogInSection({ next, banner }: { next: string; banner?: string }) {
  const [forgot, setForgot] = useState<string | null>(null);
  return forgot === null ? (
    <LogInForm next={next} banner={banner} onForgot={setForgot} />
  ) : (
    <ForgotForm email={forgot} onBack={() => setForgot(null)} />
  );
}

function LogInForm({ next, banner, onForgot }: { next: string; banner?: string; onForgot: (email: string) => void }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(logIn, {});
  const emailRef = useRef<HTMLInputElement>(null);
  return (
    <form action={action} className="grid gap-4" noValidate>
      <div className="grid gap-1">
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Log in to manage your race registrations.</CardDescription>
      </div>
      {banner && !state.error && !state.notice && <Notice message={banner} />}
      <input type="hidden" name="next" value={next} />
      <Field
        ref={emailRef}
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
        action={
          <button
            type="button"
            onClick={() => onForgot(emailRef.current?.value ?? "")}
            className="text-sm font-medium text-link underline-offset-4 outline-none hover:underline focus-visible:underline"
          >
            Forgot password?
          </button>
        }
      />
      <Notice message={state.notice} />
      <FormError message={state.error} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Logging in…" : "Log In"}
      </Button>
    </form>
  );
}

function ForgotForm({ email, onBack }: { email: string; onBack: () => void }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(forgotPassword, {});
  if (state.sentTo) {
    return (
      <SentPanel
        title="Check your email"
        to={state.sentTo}
        text="If there's a RaceLink account for this address, we sent a link to reset your password. It expires in 1 hour."
        onBack={onBack}
      />
    );
  }
  return (
    <form action={action} className="grid gap-4" noValidate>
      <div className="grid gap-1">
        <CardTitle>Forgot your password?</CardTitle>
        <CardDescription>Enter your account email and we&apos;ll send you a link to choose a new one.</CardDescription>
      </div>
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        autoFocus
        defaultValue={state.values?.email ?? email}
        error={state.fieldErrors?.email}
      />
      <FormError message={state.error} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
      <BackButton onClick={onBack} />
    </form>
  );
}

function SignUpForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, {});
  if (state.sentTo) {
    return (
      <SentPanel
        title="Verify your email"
        to={state.sentTo}
        text="Open the link in that email to activate your account. You'll be logged in right after. The link expires in 24 hours, so check your spam folder if you don't see it."
      />
    );
  }
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

// after an email goes out: where it went and what to do next
function SentPanel({ title, to, text, onBack }: { title: string; to: string; text: string; onBack?: () => void }) {
  return (
    <div role="status" className="grid gap-4">
      <span className="grid size-12 place-items-center rounded-xl bg-marking text-marking-foreground">
        <MailCheck className="size-6" aria-hidden />
      </span>
      <div className="grid gap-1">
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          We sent an email to <strong className="font-semibold break-all text-foreground">{to}</strong>.
        </CardDescription>
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
      {onBack && <BackButton onClick={onBack} />}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="justify-self-center text-sm font-medium text-link underline-offset-4 outline-none hover:underline focus-visible:underline">
      Back to log in
    </button>
  );
}

function Notice({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="status" className="rounded-lg bg-brand-light/15 px-3 py-2 text-sm text-foreground">
      {message}
    </p>
  );
}

// password field with the live requirement list under it
export function NewPasswordField({ error: serverError }: { error?: string }) {
  const [value, setValue] = useState("");
  const id = useId();
  // drop the server's complaint once every rule is met
  const error = PASSWORD_RULES.every((r) => r.test(value)) ? undefined : serverError;
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

export function Field({
  label,
  name,
  error,
  hint,
  action,
  ...props
}: ComponentProps<typeof Input> & { label: string; name: string; error?: string; hint?: string; action?: ReactNode }) {
  const id = `${useId()}-${name}`;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="grid gap-1.5">
      {action ? (
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={id}>{label}</Label>
          {action}
        </div>
      ) : (
        <Label htmlFor={id}>{label}</Label>
      )}
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

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  );
}
