import { Suspense, ViewTransition } from "react";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { homeFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";

// public site: signed-in users go back to their workspace, logout is the only way here
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <SiteHeader />
      <main className="flex-1">
        {/* page-nav links lang ang nag-a-animate; opening/closing the login modal must not lift the page above it */}
        <ViewTransition default={{ "page-nav": "page-swap", default: "none" }}>{children}</ViewTransition>
      </main>
      <SiteFooter />
    </>
  );
}

async function RedirectIfSignedIn() {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));
  return null;
}
