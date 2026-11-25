import { Suspense, ViewTransition } from "react";
import { AppHeader } from "@/components/app-header";
import { TermsDialog } from "@/components/runner/terms-dialog";
import { hasAcceptedTerms } from "@/lib/queries/terms";
import { getCurrentUser } from "@/lib/session";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        {/* header tabs tag nav-forward / nav-back; everything else gets the soft page swap */}
        <ViewTransition default={{ "nav-forward": "nav-forward", "nav-back": "nav-back", "tab-switch": "tab-swap", default: "page-swap" }}>
          {/* page loads lang ang gumagamit nito; sa tab switch, naka-stay yung current page hanggang ready yung next */}
          <Suspense fallback={<div className="min-h-96" />}>{children}</Suspense>
        </ViewTransition>
      </main>
      <Suspense fallback={null}>
        <TermsGate />
      </Suspense>
    </>
  );
}

// runners must consent to the current terms before using the runner side
async function TermsGate() {
  const user = await getCurrentUser();
  if (!user || user.role !== "runner") return null;
  return (await hasAcceptedTerms(user.id)) ? null : <TermsDialog />;
}
