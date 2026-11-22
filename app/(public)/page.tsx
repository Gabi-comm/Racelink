import { Hero } from "@/components/landing/hero";
import { HostARace } from "@/components/landing/host-a-race";
import { HowItWorks } from "@/components/landing/how-it-works";

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <HostARace />
    </>
  );
}
