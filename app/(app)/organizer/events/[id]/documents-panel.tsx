"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/lib/upload-client";
import { checkFile, MAX_EVENT_FILES, UPLOAD_KINDS } from "@/lib/uploads";
import { addDocument, deleteDocument } from "../../actions";

type Doc = { id: number; title: string; url: string; image: boolean };

const KINDS = [
  { value: "poster", label: "Race poster" },
  { value: "sizes", label: "Shirt size chart" },
  { value: "other", label: "Other file" },
] as const;
type Kind = (typeof KINDS)[number]["value"];

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function DocumentsPanel({ eventId, documents }: { eventId: number; documents: Doc[] }) {
  const [kind, setKind] = useState<Kind>("poster");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [removing, startRemove] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const full = documents.length >= MAX_EVENT_FILES;
  const left = MAX_EVENT_FILES - documents.length;

  function pick(f: File | null) {
    setError("");
    if (f) {
      const problem = checkFile("document", f.type, f.size);
      if (problem) {
        setError(problem);
        if (fileInput.current) fileInput.current.value = "";
        return setFile(null);
      }
    }
    setFile(f);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (full) return setError(`You've reached ${MAX_EVENT_FILES} files. Remove one to add another.`);
    if (!file) return setError("Choose a file to upload.");
    const title = kind === "other" ? name.trim() : KINDS.find((k) => k.value === kind)!.label;
    if (title.length < 2) return setError("Give the file a name, like Race map.");

    setBusy(true);
    const up = await uploadFile("document", file);
    if ("error" in up) {
      setBusy(false);
      return setError(up.error);
    }
    const res = await addDocument(eventId, { title, key: up.key });
    setBusy(false);
    if (!res.ok) return setError(res.error);

    toast.success(`Added ${title}.`);
    setName("");
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
        <h2 className="font-display text-xl font-bold">Posters and size charts</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload the race poster, the shirt size chart, or other files like a route map. Runners see them in the race details.
        </p>
        <p className={cn("mt-3 text-sm font-semibold tabular-nums", full && "text-link")}>
          {documents.length} of {MAX_EVENT_FILES} files
        </p>
      </div>

      <div className="grid gap-5">
        {documents.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {documents.map((d) => (
              <li key={d.id} className="group grid content-start gap-1.5">
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative block aspect-[3/4] overflow-hidden rounded-md bg-muted ring-1 ring-border transition-shadow hover:ring-foreground/30"
                  aria-label={`Open ${d.title}`}
                >
                  {d.image ? (
                    // signed storage URLs, so a plain img is simpler than next/image remote config
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.url} alt="" className="size-full object-cover" loading="lazy" />
                  ) : (
                    <span className="grid size-full place-content-center justify-items-center gap-1 text-muted-foreground">
                      <FileText className="size-8" aria-hidden />
                      <span className="text-xs font-semibold">PDF</span>
                    </span>
                  )}
                </a>
                <div className="flex items-center gap-1">
                  <p className="min-w-0 flex-1 truncate text-sm font-medium" title={d.title}>
                    {d.title}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={removing}
                    onClick={() => remove(d)}
                    aria-label={`Remove ${d.title}`}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No files yet. Start with the race poster.</p>
        )}

        {full ? (
          <p className="text-sm text-muted-foreground">You&apos;ve reached the {MAX_EVENT_FILES}-file limit. Remove a file to upload another.</p>
        ) : (
          <form onSubmit={add} className="grid gap-3 border-t pt-5 sm:grid-cols-[12rem_1fr] sm:items-end">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">What is it?</span>
              <select value={kind} onChange={(e) => setKind(e.target.value as Kind)} className={selectClass}>
                {KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>
            {kind === "other" ? (
              <label className="grid gap-1.5">
                <span className="text-sm font-medium">File name</span>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Route map" maxLength={150} />
              </label>
            ) : (
              <span className="hidden sm:block" />
            )}
            <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
              <label className={cn(buttonVariants({ variant: "outline" }), "max-w-64 cursor-pointer justify-start")}>
                <ImagePlus aria-hidden />
                <span className="truncate">{file ? file.name : "Choose file"}</span>
                <input
                  ref={fileInput}
                  type="file"
                  accept={Object.keys(UPLOAD_KINDS.document.types).join(",")}
                  className="sr-only"
                  onChange={(e) => pick(e.target.files?.[0] ?? null)}
                />
              </label>
              <Button type="submit" disabled={busy || !file}>
                {busy ? "Uploading…" : "Upload"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground sm:col-span-2">
              {UPLOAD_KINDS.document.label}. {left} upload{left === 1 ? "" : "s"} left.
            </p>
            {error && (
              <p role="alert" className="text-sm text-destructive sm:col-span-2">
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
