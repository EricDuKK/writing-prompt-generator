import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { BookOpen, Lightbulb, Sparkles, Wand2 } from 'lucide-react';

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
        <main className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto">
            {/* Hero */}
            <div className="text-center mb-16">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                About GenreGenie
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                GenreGenie is an AI-powered writing prompt generator built to help writers of all levels unlock their creativity and produce their best work.
              </p>
            </div>

            {/* Mission */}
            <div className="bg-background/80 backdrop-blur-sm rounded-xl p-8 shadow-sm border border-border/50 mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Lightbulb className="size-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Our Mission</h2>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed">
                We believe every writer deserves instant access to high-quality inspiration. GenreGenie was created to eliminate writer&apos;s block by providing an intelligent writing prompt generator that understands narrative structure, genre conventions, and the creative process. Our mission is to make creative writing more accessible, enjoyable, and productive for everyone — from hobbyists to published authors.
              </p>
            </div>

            {/* What We Offer */}
            <div className="bg-background/80 backdrop-blur-sm rounded-xl p-8 shadow-sm border border-border/50 mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="size-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">What We Offer</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <BookOpen className="size-4 text-primary" />
                    Creative Writing Prompts
                  </h3>
                  <p className="text-muted-foreground">
                    Generate tailored writing prompts for fiction across genres — fantasy, thriller, romance, horror, sci-fi, and more. Each prompt includes character sketches, settings, and plot hooks.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Wand2 className="size-4 text-primary" />
                    AI-Powered Intelligence
                  </h3>
                  <p className="text-muted-foreground">
                    Our AI understands narrative structure and genre conventions. It generates prompts that are not just random — they are carefully crafted to inspire meaningful stories.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Lightbulb className="size-4 text-primary" />
                    Business Writing Support
                  </h3>
                  <p className="text-muted-foreground">
                    Beyond fiction, GenreGenie generates prompts for business emails, academic papers, sales copy, product documentation, and marketing content.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    Deep Customization
                  </h3>
                  <p className="text-muted-foreground">
                    Fine-tune every prompt with genre-specific options for style, tone, length, audience, and purpose. Translate prompts into multiple languages with one click.
                  </p>
                </div>
              </div>
            </div>

            {/* Who We Serve */}
            <div className="bg-background/80 backdrop-blur-sm rounded-xl p-8 shadow-sm border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="size-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Who We Serve</h2>
              </div>
              <ul className="space-y-3 text-muted-foreground text-lg">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Fiction Writers</strong> looking for fresh story ideas and creative prompts to kickstart their next novel or short story.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Students &amp; Academics</strong> who need structured prompts for essays, research papers, and thesis writing.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Content Creators &amp; Marketers</strong> seeking compelling copy ideas for blogs, social media, and ad campaigns.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Writing Teachers</strong> who want to provide diverse, engaging prompts for classroom exercises and workshops.</span>
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
