"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Upload } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/lib/upload-client";
import { UPLOAD_KINDS } from "@/lib/uploads";

// uploads the receipt right away, the form only sends the key
export function ReceiptPicker({ error, onBusyChange }: { error?: string; onBusyChange?: (busy: boolean) => void }) {
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setProblem("");
    setBusy(true);
    onBusyChange?.(true);
    const res = await uploadFile("receipt", file);
    setBusy(false);
    onBusyChange?.(false);
    if (input.current) input.current.value = "";
    if ("error" in res) {
      setProblem(res.error);
      return;
    }
    setKey(res.key);
    setName(file.name);
    setPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
  }

  const shown = problem || error;
  return (
    <div className="grid gap-3">
      <input type="hidden" name="receiptKey" value={key} />
      {key && (
        <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-3 ring-1 ring-emerald-200">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Receipt preview" className="size-14 rounded-md object-cover" />
          ) : (
            <CheckCircle2 className="size-5 text-emerald-700" aria-hidden />
          )}
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-emerald-900">Receipt uploaded</p>
            <p className="truncate text-emerald-800">{name}</p>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <label
          className={cn(
            buttonVariants({ variant: key ? "outline" : "default", size: "lg" }),
            "h-10 cursor-pointer px-4",
            busy && "pointer-events-none opacity-60",
          )}
        >
          <Upload aria-hidden />
          {busy ? "Uploading…" : key ? "Use a different file" : "Upload receipt"}
          <input
            ref={input}
            type="file"
            accept={Object.keys(UPLOAD_KINDS.receipt.types).join(",")}
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </label>
        <span className="text-sm text-muted-foreground">{UPLOAD_KINDS.receipt.label}</span>
      </div>
      {shown && (
        <p role="alert" className="text-sm text-destructive">
          {shown}
        </p>
      )}
    </div>
  );
}
