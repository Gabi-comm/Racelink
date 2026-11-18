import { About } from "@/components/landing/about";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { RacesSection } from "@/components/landing/races-section";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { getPublicEvents } from "@/lib/queries/events";

export default function Home({ searchParams }: PageProps<"/">) {
  // isang query lang, shared ng hero at race list
  const eventsPromise = getPublicEvents();
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero eventsPromise={eventsPromise} />
        <RacesSection eventsPromise={eventsPromise} searchParams={searchParams} />
        <HowItWorks />
        <About />
      </main>
      <SiteFooter />
    </>
  );
}
