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
        <ViewTransition>{children}</ViewTransition>
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
