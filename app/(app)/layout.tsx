import { ViewTransition } from "react";
import { AppHeader } from "@/components/app-header";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <ViewTransition>{children}</ViewTransition>
      </main>
    </>
  );
}
