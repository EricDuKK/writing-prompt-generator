import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ContactContent } from './contact-content';

export const metadata: Metadata = {
  title: 'Contact Us | GenreGenie',
  description: 'Get in touch with the GenreGenie team. We are happy to help with any questions about our writing prompt generator.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 bg-muted/30 bg-[url('/images/background.webp')] bg-cover bg-center bg-no-repeat bg-fixed">
        <Navbar />
        <ContactContent />
      </div>
      <Footer />
    </div>
  );
}
