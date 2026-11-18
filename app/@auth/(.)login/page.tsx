import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/app/(auth)/login/auth-form";
import { safeNext } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import { LoginModal } from "./login-modal";

export const metadata: Metadata = { title: "Log in" };

// popup na login kapag galing sa link sa loob ng site
export default function LoginModalPage({ searchParams }: PageProps<"/login">) {
  return (
    <LoginModal>
      <Suspense fallback={<div className="h-[22rem]" />}>
        <Gate searchParams={searchParams} />
      </Suspense>
    </LoginModal>
  );
}

async function Gate({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getCurrentUser()) redirect(next);
  return <AuthPanel next={next} />;
}
