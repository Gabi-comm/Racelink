import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Card, CardContent } from "@/components/ui/card";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <Link href="/" aria-label="RaceLink home">
        <Logo className="h-12" priority />
      </Link>
      <Card className="w-full max-w-sm">
        <CardContent>
          <Suspense fallback={<div className="h-72" />}>
            <Reset searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}

// the email link lands here with ?token=..., or ?error=INVALID_TOKEN when it expired
async function Reset({ searchParams }: Pick<PageProps<"/reset-password">, "searchParams">) {
  const { token, error } = await searchParams;
  return <ResetForm token={typeof token === "string" && token && !error ? token : null} />;
}
