'use client';

import { useLocaleContext } from './locale-context';
import { uiTranslations } from './ui-translations';

export function useUITranslations() {
  const { locale } = useLocaleContext();
  return uiTranslations[locale];
}
