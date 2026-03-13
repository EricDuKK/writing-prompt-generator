'use client';

import { Globe } from 'lucide-react';
import { useLocaleContext } from '@/i18n/locale-context';

export function LocaleToggle() {
  const { locale, setLocale } = useLocaleContext();

  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
      className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md border border-border/50 bg-background hover:bg-muted transition-colors"
      title={locale === 'en' ? '切换到中文' : 'Switch to English'}
    >
      <Globe className="size-3.5" />
      <span>{locale === 'en' ? '中文' : 'EN'}</span>
    </button>
  );
}
