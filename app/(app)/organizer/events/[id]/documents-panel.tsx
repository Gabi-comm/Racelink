"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/lib/upload-client";
import { UPLOAD_KINDS } from "@/lib/uploads";
import { addDocument, deleteDocument } from "../../actions";

type Doc = { id: number; title: string; url: string };

export function DocumentsPanel({ eventId, documents }: { eventId: number; documents: Doc[] }) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [removing, startRemove] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!file) return setError("Choose a file to upload.");
    if (title.trim().length < 2) return setError("Give the file a name, like Race map.");

    setBusy(true);
    const up = await uploadFile("document", file);
    if ("error" in up) {
      setBusy(false);
      return setError(up.error);
    }
    const res = await addDocument(eventId, { title, key: up.key });
    setBusy(false);
    if (!res.ok) return setError(res.error);

    toast.success(`Added ${title.trim()}.`);
    setTitle("");
    setFile(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function remove(doc: Doc) {
    startRemove(async () => {
      const res = await deleteDocument(eventId, doc.id);
      if (res.ok) toast.success(`Removed ${doc.title}.`);
      else toast.error(res.error);
    });
  }

  return (
    <section className="grid gap-5 rounded-lg bg-card p-5 ring-1 ring-border md:grid-cols-[14rem_1fr] md:gap-8 md:p-6">
      <div>
        <h2 className="font-display text-xl font-bold">Race files</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Route maps, waivers or race kits. Runners can open them from the race details.
        </p>
      </div>
      <div className="grid gap-4">
        {documents.length > 0 ? (
          <ul className="divide-y rounded-lg ring-1 ring-border">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-3 py-2.5">
                <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <a href={d.url} target="_blank" rel="noreferrer" className="flex-1 truncate font-medium hover:underline">
                  {d.title}
                </a>
                <Button variant="ghost" size="sm" className="text-destructive" disabled={removing} onClick={() => remove(d)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No files yet.</p>
        )}

        <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">File name</span>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Race map" maxLength={150} />
          </label>
          <label className={cn(buttonVariants({ variant: "outline" }), "h-8 max-w-56 cursor-pointer justify-start")}>
            <Upload aria-hidden />
            <span className="truncate">{file ? file.name : "Choose file"}</span>
            <input
              ref={fileInput}
              type="file"
              accept={Object.keys(UPLOAD_KINDS.document.types).join(",")}
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? "Uploading…" : "Add file"}
          </Button>
          <p className="text-sm text-muted-foreground sm:col-span-3">{UPLOAD_KINDS.document.label}</p>
          {error && (
            <p role="alert" className="text-sm text-destructive sm:col-span-3">
              {error}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
