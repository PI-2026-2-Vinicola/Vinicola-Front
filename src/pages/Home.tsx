import { Benefits, HomeHero, HowToUse, LearnGrapes, ProjectIntro, Shortcuts } from '../components/home/HomeSections';

/** Página inicial institucional e educativa (a documentação técnica fica em /sobre). */
export default function Home() {
  return (
    <>
      <HomeHero />
      <ProjectIntro />
      <LearnGrapes />
      <HowToUse />
      <Benefits />
      <Shortcuts />
    </>
  );
}
