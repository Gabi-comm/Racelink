"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ROLES } from "@/lib/constants";
import { ROLE_LABEL } from "@/lib/roles";
import { banUser, changeRole, unbanUser } from "./actions";

export function RoleSelect({ userId, name, role }: { userId: string; name: string; role: string }) {
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(role);

  function onChange(next: string) {
    const prev = value;
    setValue(next);
    startTransition(async () => {
      const res = await changeRole(userId, next);
      if (!res.ok) {
        setValue(prev);
        toast.error(res.error);
        return;
      }
      toast.success(res.message);
    });
  }

  return (
    <select
      aria-label={`Role for ${name}`}
      value={value}
      disabled={pending}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABEL[r]}
        </option>
      ))}
    </select>
  );
}

export function BanButton({ userId, name, banned }: { userId: string; name: string; banned: boolean }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const reasonId = useId();

  function run(fn: () => Promise<{ ok: true; message: string } | { ok: false; error: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      setOpen(false);
      setReason("");
      toast.success(res.message);
    });
  }

  if (banned) {
    return (
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => unbanUser(userId))}>
        Unban
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setOpen(true)}>
        Ban
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ban {name}?</DialogTitle>
          <DialogDescription>They&apos;re signed out right away and can&apos;t log in until you unban them. Their bookings stay.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <label htmlFor={reasonId} className="text-sm font-medium">
            Reason
          </label>
          <Input id={reasonId} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255} aria-invalid={!!error || undefined} />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Keep access</DialogClose>
          <Button variant="destructive" disabled={pending} onClick={() => run(() => banUser(userId, reason))}>
            {pending ? "Banning…" : "Ban user"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
