import { Hero } from '../components/landing/Hero';
import { Architecture, Cycle, FinalCta, FullFlow, GrapesPreview, Meaning, PlatformPreview, Sustainability, TechStack, ValeSection, YoloShowcase } from '../components/landing/Sections';

export default function Home() {
  return (
    <>
      <Hero />
      <Meaning />
      <Cycle />
      <Architecture />
      <YoloShowcase />
      <PlatformPreview />
      <GrapesPreview />
      <ValeSection />
      <Sustainability />
      <TechStack />
      <FullFlow />
      <FinalCta />
    </>
  );
}
