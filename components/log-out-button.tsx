"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { logOut } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";

export function LogOutButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button variant="ghost" size="sm" disabled={pending} onClick={() => startTransition(() => logOut())}>
      <LogOut aria-hidden />
      {pending ? "Logging out…" : "Log out"}
    </Button>
  );
}
