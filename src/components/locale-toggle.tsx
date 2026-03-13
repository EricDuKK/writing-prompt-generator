'use client';

import { Globe, Check } from 'lucide-react';
import { useLocaleContext, type Locale } from '@/i18n/locale-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages: { value: Locale; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'zh', label: '简体中文', flag: '🇨🇳' },
];

export function LocaleToggle() {
  const { locale, setLocale } = useLocaleContext();
  const current = languages.find((l) => l.value === locale) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md border border-border/50 bg-background hover:bg-muted transition-colors cursor-pointer"
          title="Switch language"
        >
          <Globe className="size-3.5" />
          <span>{current.flag} {current.value.toUpperCase()}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.value}
            onClick={() => setLocale(lang.value)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </span>
            {locale === lang.value && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
