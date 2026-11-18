
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
      <div className="max-w-3xl">
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
        </div>

      </div>
    </section>
  );
}
