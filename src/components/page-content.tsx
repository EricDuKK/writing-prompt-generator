'use client';

import {
  BookOpen,
  Briefcase,
  FileText,
  GraduationCap,
  Heart,
  HelpCircle,
  Info,
  Languages,
  Lightbulb,
  Mail,
  Megaphone,
  Skull,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { FaqSection } from '@/components/faq-section';
import { useUITranslations } from '@/i18n/use-ui-translations';

const featureIcons = [Wand2, Lightbulb, Languages, FileText];

export function HeroSection() {
  const t = useUITranslations();

  return (
    <section className="container mx-auto px-4 pt-6 md:pt-10 pb-4 md:pb-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
          {t.hero.title}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {t.hero.subtitle}
        </p>
      </div>
    </section>
  );
}

export function PageContent() {
  const t = useUITranslations();

  return (
    <>
      {/* Section: Overcome Writer's Block */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Lightbulb className="size-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {t.sections.writersBlock.title}
            </h2>
          </div>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {t.sections.writersBlock.description}
          </p>
        </div>
      </section>

      {/* Section: Story Starters */}
      <section className="container mx-auto px-4 py-16 md:py-20 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="size-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {t.sections.storyStarters.title}
            </h2>
          </div>
          <p className="text-muted-foreground text-lg leading-relaxed mb-12">
            {t.sections.storyStarters.description}
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { icon: Sparkles, ...t.sections.storyStarters.fantasy },
              { icon: Wand2, ...t.sections.storyStarters.thriller },
              { icon: Heart, ...t.sections.storyStarters.romance },
              { icon: Skull, ...t.sections.storyStarters.horror },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-background rounded-xl p-6 shadow-sm border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="size-5 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section: Business Writing Prompts */}
      <section className="container mx-auto px-4 py-16 md:py-20 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Briefcase className="size-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {t.sections.business.title}
            </h2>
          </div>
          <p className="text-muted-foreground text-lg leading-relaxed mb-12">
            {t.sections.business.description}
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { icon: Mail, ...t.sections.business.email },
              { icon: GraduationCap, ...t.sections.business.academic },
              { icon: Megaphone, ...t.sections.business.marketing },
              { icon: FileText, ...t.sections.business.docs },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-background rounded-xl p-6 shadow-sm border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="size-5 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section: How to Use */}
      <section className="container mx-auto px-4 py-16 md:py-20 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="size-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {t.sections.howToUse.title}
            </h2>
          </div>
          <p className="text-muted-foreground text-lg leading-relaxed mb-10">
            {t.sections.howToUse.description}
          </p>

          <div className="grid gap-6 mb-10">
            {t.sections.howToUse.steps.map((step, index) => (
              <div
                key={index}
                className="flex gap-4 bg-background rounded-xl p-6 shadow-sm border border-border/50"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Lightbulb className="size-5 text-primary" />
              {t.sections.howToUse.proTips}
            </h3>
            <ul className="space-y-3 text-muted-foreground">
              {t.sections.howToUse.tips.map((tip, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-primary">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Section: Why Choose Us */}
      <section id="features" className="container mx-auto px-4 py-16 md:py-20 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="size-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {t.sections.whyChoose.title}
            </h2>
          </div>
          <p className="text-muted-foreground text-lg leading-relaxed mb-10">
            {t.sections.whyChoose.description}
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {t.sections.whyChoose.features.map((feature, index) => {
              const Icon = featureIcons[index];
              return (
                <div
                  key={feature.key}
                  className="bg-background rounded-xl p-6 shadow-sm border border-border/50"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  </div>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section: FAQ */}
      <section id="faq" className="container mx-auto px-4 py-16 md:py-20 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <HelpCircle className="size-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {t.sections.faq.title}
            </h2>
          </div>
          <p className="text-muted-foreground text-lg leading-relaxed mb-10">
            {t.sections.faq.description}
          </p>
          <FaqSection />
        </div>
      </section>

      {/* Section: About */}
      <section id="about" className="container mx-auto px-4 py-16 md:py-20 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Info className="size-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {t.sections.aboutSection.title}
            </h2>
          </div>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {t.sections.aboutSection.description}
          </p>
        </div>
      </section>
    </>
  );
}
