import dynamic from 'next/dynamic';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { HeroSection, PageContent } from '@/components/page-content';

const PromptGenerator = dynamic(
  () => import('@/components/prompt-generator/prompt-generator').then(mod => mod.PromptGenerator),
);

export default function WritingPromptsPage() {
  return (
    <>
      <head>
        <link rel="canonical" href="https://genregenie.top/" />
      </head>
      <div className="flex flex-col">
        <main className="bg-muted/30 bg-[url('/images/background.webp')] bg-cover bg-center bg-no-repeat bg-fixed">
        <Navbar />

        {/* Hero Section with H1 */}
        <HeroSection />

        {/* Prompt Generator Tool */}
        <section className="container mx-auto px-4 pb-8">
          <PromptGenerator
            hideHeader={true}
          />
        </section>

        {/* Content Sections */}
        <PageContent />
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}
