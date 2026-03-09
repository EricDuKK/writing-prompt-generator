import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us | GenreGenie',
  description: 'Get in touch with the GenreGenie team. We are happy to help with any questions about our writing prompt generator.',
};

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 bg-muted/30 bg-[url('/images/background.webp')] bg-cover bg-center bg-no-repeat bg-fixed">
        <Navbar />
        <main className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-6">
              <Mail className="size-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Contact Us
            </h1>
            <p className="text-muted-foreground text-lg mb-10">
              Have a question, feedback, or need help with our writing prompt generator? We&apos;d love to hear from you.
            </p>

            <div className="bg-background/80 backdrop-blur-sm rounded-xl p-8 shadow-sm border border-border/50">
              <h2 className="text-xl font-semibold text-foreground mb-2">Email Us</h2>
              <p className="text-muted-foreground mb-4">
                Send us an email and we&apos;ll get back to you within 24 hours.
              </p>
              <a
                href="mailto:support@promptgenerators.cc"
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-lg transition-colors"
              >
                <Mail className="size-5" />
                support@promptgenerators.cc
              </a>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
