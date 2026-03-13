import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { AboutContent } from './about-content';

export const metadata: Metadata = {
  title: 'About GenreGenie | AI Writing Prompt Generator',
  description: 'Learn about GenreGenie, the AI-powered writing prompt generator that helps writers overcome creative blocks and generate unique story ideas across every genre.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 bg-muted/30 bg-[url('/images/background.webp')] bg-cover bg-center bg-no-repeat bg-fixed">
        <Navbar />
        <AboutContent />
      </div>
      <Footer />
    </div>
  );
}
