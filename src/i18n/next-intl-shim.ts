// Shim to replace next-intl with locale-aware translations
import translationsEn from './translations.json';
import translationsZh from './translations-zh.json';
import { useLocaleContext } from './locale-context';

const translationsMap: Record<string, any> = {
  en: translationsEn,
  zh: translationsZh,
};

function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

type TranslateFunction = {
  (key: string, params?: Record<string, any>): string;
  rich: (key: string, params?: Record<string, any>) => string;
  raw: (key: string) => any;
};

export function useTranslations(namespace?: string): TranslateFunction {
  const { locale } = useLocaleContext();
  const translations = translationsMap[locale] || translationsEn;

  const t = ((key: string, params?: Record<string, any>) => {
    // If there's a defaultValue in params, use it as fallback
    const defaultValue = params?.defaultValue;

    let value: string;
    if (namespace) {
      // For 'HomePage.promptGenerator' namespace, strip the prefix
      const ns = namespace.replace('HomePage.', '');
      if (ns === 'promptGenerator') {
        value = getNestedValue(translations, key);
      } else {
        value = key;
      }
    } else {
      value = getNestedValue(translations, key);
    }

    // If value is undefined or not found, try English fallback
    if (value === undefined || value === null) {
      if (namespace) {
        const ns = namespace.replace('HomePage.', '');
        if (ns === 'promptGenerator') {
          value = getNestedValue(translationsEn, key);
        }
      } else {
        value = getNestedValue(translationsEn, key);
      }
    }

    // If still not found, use the key itself
    if (value === undefined || value === null) {
      value = key;
    }

    // If value equals key (not found), use defaultValue
    if (value === key && defaultValue) {
      value = defaultValue;
    }

    // Simple template replacement for {param} patterns
    if (params && typeof value === 'string') {
      for (const [k, v] of Object.entries(params)) {
        if (k !== 'defaultValue') {
          value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
    }

    return typeof value === 'string' ? value : key;
  }) as TranslateFunction;

  t.rich = (key: string, params?: Record<string, any>) => t(key, params);
  t.raw = (key: string) => {
    if (key.startsWith('HomePage.promptGenerator.')) {
      const val = getNestedValue(translations, key.replace('HomePage.promptGenerator.', ''));
      if (val !== undefined) return val;
      return getNestedValue(translationsEn, key.replace('HomePage.promptGenerator.', ''));
    }
    const val = getNestedValue(translations, key);
    if (val !== undefined) return val;
    return getNestedValue(translationsEn, key);
  };

  return t;
}

export function useLocale(): string {
  const { locale } = useLocaleContext();
  return locale;
}

export function useMessages(): any {
  const { locale } = useLocaleContext();
  const translations = translationsMap[locale] || translationsEn;
  return { HomePage: { promptGenerator: translations } };
}
