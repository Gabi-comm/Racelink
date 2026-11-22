import type { Metadata } from "next";
import { Building2, ClipboardCheck, Footprints, type LucideIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "About us",
  description: "What RaceLink is and how it works for runners, organizers and organizations.",
};

const FOR_WHO: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Footprints,
    title: "Runners",
    text: "One account for every race you join. Pick a distance, upload your receipt, and see your payment status and bib number in one place.",
  },
  {
    icon: ClipboardCheck,
    title: "Organizers",
    text: "Post races with their distances and fees, review receipts, assign bibs, check runners in on race day, and track sign-ups and fees.",
  },
  {
    icon: Building2,
    title: "Organizations",
    text: "Schools, barangays, companies and clubs send a race request. An organizer reviews it and sets up the race when it's approved.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-16 md:pt-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">About us</p>
          <h1 className="mt-3 font-display text-[clamp(2.25rem,4.5vw,3.5rem)] leading-[1.08] font-extrabold tracking-tight text-balance">
            What is <span className="text-primary">RaceLink?</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            RaceLink is a race registration platform for fun runs and marathons in Metro Manila and nearby. Runners sign up for
            a race, pick a distance and upload their payment receipt. Organizers review payments, assign bib numbers and check
            runners in on race day. Schools, barangays, companies and running clubs can request a race and have it set up on
            RaceLink.
          </p>
        </div>
      </section>

      <section aria-labelledby="who-title" className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 id="who-title" className="font-display text-2xl font-bold tracking-tight">
            Who it&apos;s for
          </h2>
          <ul className="mt-8 grid gap-10 md:grid-cols-3">
            {FOR_WHO.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <Icon className="size-6 text-primary" aria-hidden />
                <h3 className="mt-3 font-display text-xl font-bold">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

    </>
  );
}
