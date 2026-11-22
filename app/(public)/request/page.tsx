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
    <div className="mx-auto max-w-3xl px-4 py-14 md:py-20">
      <h1 className="sr-only">Request a race</h1>
      <Suspense fallback={<div className="h-[40rem] rounded-xl bg-card ring-1 ring-border" />}>
        <Form />
      </Suspense>
    </div>
  );
}

async function Form() {
  await connection();
  return <RequestForm minDate={todayInManila()} />;
}
