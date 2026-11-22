import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { getCurrentUser } from "@/lib/session";
import { homeFor, safeNext } from "@/lib/roles";
import { AuthForm } from "./auth-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <Link href="/" aria-label="RaceLink home">
        <Logo className="h-12" priority />
      </Link>
      <Suspense fallback={<div className="h-[26rem] w-full max-w-sm rounded-xl border bg-card" />}>
        <Gate searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Gate({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const user = await getCurrentUser();
  if (user) redirect(next || homeFor(user.role));
  return <AuthForm next={next} />;
}
