import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Forbidden() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-sm font-medium text-muted-foreground">403</p>
      <h1 className="text-2xl font-semibold tracking-tight">You don&apos;t have access to this page</h1>
      <p className="max-w-sm text-muted-foreground">
        This page is for a different account type. Go back to your dashboard to continue.
      </p>
      <Link href="/dashboard" className={buttonVariants()}>
        Back to dashboard
      </Link>
    </main>
  );
}
