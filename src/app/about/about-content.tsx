'use client';

import { BookOpen, Lightbulb, Sparkles, Wand2 } from 'lucide-react';
import { useUITranslations } from '@/i18n/use-ui-translations';

export function AboutContent() {
  const t = useUITranslations();

  return (
    <main className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t.aboutPage.heroTitle}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t.aboutPage.heroDescription}
          </p>
        </div>

        {/* Mission */}
        <div className="bg-background/80 backdrop-blur-sm rounded-xl p-8 shadow-sm border border-border/50 mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Lightbulb className="size-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {t.aboutPage.missionTitle}
            </h2>
          </div>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {t.aboutPage.missionDescription}
          </p>
        </div>

        {/* What We Offer */}
        <div className="bg-background/80 backdrop-blur-sm rounded-xl p-8 shadow-sm border border-border/50 mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="size-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {t.aboutPage.offerTitle}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <BookOpen className="size-4 text-primary" />
                {t.aboutPage.offerCreativeTitle}
              </h3>
              <p className="text-muted-foreground">
                {t.aboutPage.offerCreativeDescription}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Wand2 className="size-4 text-primary" />
                {t.aboutPage.offerAITitle}
              </h3>
              <p className="text-muted-foreground">
                {t.aboutPage.offerAIDescription}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Lightbulb className="size-4 text-primary" />
                {t.aboutPage.offerBusinessTitle}
              </h3>
              <p className="text-muted-foreground">
                {t.aboutPage.offerBusinessDescription}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                {t.aboutPage.offerCustomTitle}
              </h3>
              <p className="text-muted-foreground">
                {t.aboutPage.offerCustomDescription}
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
            <h2 className="text-2xl font-bold text-foreground">
              {t.aboutPage.serveTitle}
            </h2>
          </div>
          <ul className="space-y-3 text-muted-foreground text-lg">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>{t.aboutPage.serveFiction}</strong>{' '}
                {t.aboutPage.serveFictionDesc}
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>{t.aboutPage.serveStudents}</strong>{' '}
                {t.aboutPage.serveStudentsDesc}
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>{t.aboutPage.serveMarketers}</strong>{' '}
                {t.aboutPage.serveMarketersDesc}
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>{t.aboutPage.serveTeachers}</strong>{' '}
                {t.aboutPage.serveTeachersDesc}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
