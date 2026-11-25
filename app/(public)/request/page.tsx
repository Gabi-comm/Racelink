import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { todayInManila } from "@/lib/events";
import { RequestForm } from "./request-form";

export const metadata: Metadata = {
  title: "Request a race",
  description: "Ask RaceLink to host your organization's fun run or marathon.",
};

export default function RequestPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 md:py-20">
      <header className="grid justify-items-center text-center">
        <p className="inline-flex rounded-full bg-marking px-3 py-1 text-[0.7rem] font-bold tracking-[0.12em] text-marking-foreground uppercase">
          Partner with RaceLink
        </p>
        <h1 className="mt-5 font-[family-name:var(--font-oswald)] text-[clamp(2.5rem,7vw,4rem)] leading-[0.95] font-bold tracking-tight uppercase">
          <span className="block">Bring your race</span>
          <span className="block text-brand-light">to the start line.</span>
        </h1>
        <p className="mt-5 max-w-xl text-muted-foreground">
          Share your vision. Our team will help turn it into a race day runners remember.
        </p>
      </header>
      <div className="mt-10">
        <Suspense fallback={<div className="h-[40rem] rounded-2xl bg-card ring-1 ring-border" />}>
          <Form />
        </Suspense>
      </div>
    </div>
  );
}

async function Form() {
  await connection();
  return <RequestForm minDate={todayInManila()} />;
}
