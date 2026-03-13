'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useUITranslations } from '@/i18n/use-ui-translations';

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const t = useUITranslations();

  return (
    <div className="space-y-3">
      {t.faqItems.map((item, index) => (
        <div
          key={index}
          className="bg-background rounded-xl border border-border/50 overflow-hidden"
        >
          <button
            className="w-full flex items-center justify-between px-6 py-4 text-left"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <span className="font-medium text-foreground pr-4">{item.question}</span>
            <ChevronDown
              className={`size-5 text-muted-foreground shrink-0 transition-transform duration-200 ${
                openIndex === index ? 'rotate-180' : ''
              }`}
            />
          </button>
          {openIndex === index && (
            <div className="px-6 pb-4">
              <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
