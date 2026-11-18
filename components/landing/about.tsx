import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { AwsDiagram } from "./aws-diagram";

const FOR_WHO = [
  {
    title: "For runners",
    text: "One account for every race you join. See your payment status, bib number and race details in one place.",
  },
  {
    title: "For organizers",
    text: "Post races with their distances and fees, review payment receipts, assign bibs, and check runners in on race day.",
  },
];

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="mx-auto w-full max-w-6xl px-4 py-20">
      <div className="grid gap-12 md:grid-cols-[1fr_1.1fr] md:gap-16">
        <div>
          <h2 id="about-title" className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
            About RaceLink
          </h2>
          <p className="mt-5 text-lg leading-relaxed">
            RaceLink started as a class project by four Computer Science students at the University of the East.
            Local races still run sign-ups through forms, chat threads and spreadsheets. We built one place where
            runners can register and pay, and organizers can keep track of everyone.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {FOR_WHO.map((item) => (
              <div key={item.title}>
                <h3 className="font-display text-2xl font-bold">{item.title}</h3>
                <p className="mt-1.5 leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-lg bg-card p-5 ring-1 ring-border">
            <h3 className="font-display text-xl font-bold">Organizing a race?</h3>
            <p className="mt-1 text-muted-foreground">
              Create an account, then ask a RaceLink admin to switch it to an organizer account so you can post races.
            </p>
            <Link href="/login?tab=signup" className={buttonVariants({ variant: "outline", size: "lg", className: "mt-4" })}>
              Create an account
            </Link>
          </div>
        </div>

        <figure>
          <h3 className="font-display text-2xl font-bold">How it runs on AWS</h3>
          <p className="mt-1.5 leading-relaxed text-muted-foreground">
            The app runs on an EC2 server in a public subnet. Race and booking data live in a MySQL database on RDS,
            inside a private subnet only the app server can reach. Receipts and race files go to a private S3 bucket,
            and the server reaches it through an IAM role, so no access keys are stored in the code.
          </p>
          <AwsDiagram className="mt-6" />
        </figure>
      </div>
    </section>
  );
}
