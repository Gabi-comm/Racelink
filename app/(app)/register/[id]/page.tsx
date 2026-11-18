import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getRegisterContext, registrationBlock } from "@/lib/queries/bookings";
import { requireUser } from "@/lib/session";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage({ params }: PageProps<"/register/[id]">) {
  return (
    <div className="grid gap-6">
      <Link href="/#races" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden /> All races
      </Link>
      <Suspense fallback={<div className="h-96 rounded-lg bg-card ring-1 ring-border" />}>
        <Register params={params} />
      </Suspense>
    </div>
  );
}

async function Register({ params }: Pick<PageProps<"/register/[id]">, "params">) {
  const user = await requireUser();
  const eventId = Number((await params).id);
  if (!Number.isInteger(eventId)) notFound();

  const ctx = await getRegisterContext(user.id, eventId);
  if (!ctx) notFound();
  if (ctx.existing && ctx.existing.status !== "cancelled") redirect(`/bookings#booking-${ctx.existing.id}`);

  const blocked = registrationBlock(ctx.event);
  if (blocked) {
    return (
      <div className="rounded-lg bg-card p-10 text-center ring-1 ring-border">
        <h1 className="font-display text-3xl font-extrabold">{ctx.event.title}</h1>
        <p className="mt-2 text-muted-foreground">{blocked}</p>
        <Link href="/#races" className={buttonVariants({ size: "lg", className: "mt-5" })}>
          See other races
        </Link>
      </div>
    );
  }

  return <RegisterForm ctx={ctx} runnerName={user.name} />;
}
