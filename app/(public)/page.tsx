import { Hero } from "@/components/landing/hero";
import { HostARace } from "@/components/landing/host-a-race";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Intro } from "@/components/landing/intro";

export default function Home() {
  return (
    <>
      <Intro />
      <Hero />
      <HowItWorks />
      <HostARace />
    </>
  );
}
