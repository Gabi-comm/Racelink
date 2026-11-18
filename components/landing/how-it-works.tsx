const STEPS = [
  {
    title: "Pick a race and distance",
    text: "Choose a race, the distance you want to run, and your shirt size. You'll need a free runner account.",
  },
  {
    title: "Pay and upload your receipt",
    text: "Pay the registration fee through the organizer's payment channel, then upload a photo of your receipt.",
  },
  {
    title: "Get your bib number",
    text: "The organizer checks your payment. Once it's approved, your bib number shows up in My Bookings.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="border-y bg-card">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <h2 id="how-title" className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
          How registration works
        </h2>
        <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          <span
            aria-hidden
            className="absolute top-6 right-[16%] left-[16%] hidden border-t-2 border-dashed border-primary/40 md:block"
          />
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative flex gap-4 md:flex-col md:items-center md:text-center">
              <span className="relative z-10 grid size-12 shrink-0 place-items-center rounded-full bg-primary font-display text-2xl font-extrabold text-primary-foreground ring-8 ring-card">
                {i + 1}
              </span>
              <div className="md:max-w-xs">
                <h3 className="font-display text-2xl font-bold">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
