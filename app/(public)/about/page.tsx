import type { Metadata } from "next";
import { CalendarDays, User, Users, type LucideIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "About us",
  description: "What RaceLink is and how it works for runners, organizers and organizations.",
};

const FOR_WHO: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: User,
    title: "Runners",
    text: "One account for every race you join. Pick a distance, upload your receipt, and see your payment status and bib number in one place.",
  },
  {
    icon: CalendarDays,
    title: "Organizers",
    text: "Post races with their distances and fees, review receipts, assign bibs, check runners in on race day, and track sign-ups and fees.",
  },
  {
    icon: Users,
    title: "Organizations",
    text: "Schools, barangays, companies and clubs send a race request. An organizer reviews it and sets up the race when it's approved.",
  },
];

const oswald = "font-[family-name:var(--font-oswald)] font-bold uppercase";

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-12 md:pt-20">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-link uppercase">About us</p>
          <h1 className={`mt-3 text-[clamp(2.5rem,6vw,4rem)] leading-[0.95] tracking-tight ${oswald}`}>
            What is <span className="text-brand-light">RaceLink?</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            RaceLink is a race registration platform for fun runs and marathons in Metro Manila and nearby. Runners sign up for
            a race, pick a distance and upload their payment receipt. Organizers review payments, assign bib numbers and check
            runners in on race day. Schools, barangays, companies and running clubs can request a race and have it set up on
            RaceLink.
          </p>
        </div>
      </section>

      <section aria-labelledby="who-title" className="mx-auto max-w-6xl px-4 pt-4 pb-20">
        <p className="text-xs font-semibold tracking-[0.2em] text-link uppercase">Built for the whole race community</p>
        <h2 id="who-title" className={`mt-3 text-[clamp(2rem,4.5vw,3rem)] leading-none tracking-tight ${oswald}`}>
          Who it&apos;s for
        </h2>
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {FOR_WHO.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="rounded-2xl bg-card p-7 ring-1 ring-border">
              <div className="flex items-start justify-between">
                <span className="grid size-14 place-items-center rounded-xl bg-brand-deep text-marking">
                  <Icon className="size-6" aria-hidden />
                </span>
                <span aria-hidden className={`text-3xl text-brand-light/70 ${oswald}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className={`mt-8 text-2xl ${oswald}`}>{title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
