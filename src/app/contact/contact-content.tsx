'use client';

import { Mail } from 'lucide-react';
import { useUITranslations } from '@/i18n/use-ui-translations';

export function ContactContent() {
  const t = useUITranslations();

  return (
    <main className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-6">
          <Mail className="size-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          {t.contactPage.title}
        </h1>
        <p className="text-muted-foreground text-lg mb-10">
          {t.contactPage.description}
        </p>

        <div className="bg-background/80 backdrop-blur-sm rounded-xl p-8 shadow-sm border border-border/50">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t.contactPage.emailTitle}
          </h2>
          <p className="text-muted-foreground mb-4">
            {t.contactPage.emailDescription}
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
  );
}
