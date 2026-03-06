// Shim to replace next-intl with static English translations
import translations from './translations.json';

function getNestedValue(obj: any, path: string): string {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return path;
    current = current[part];
  }
  return typeof current === 'string' ? current : path;
}

type TranslateFunction = {
  (key: string, params?: Record<string, any>): string;
  rich: (key: string, params?: Record<string, any>) => string;
  raw: (key: string) => any;
};

export function useTranslations(namespace?: string): TranslateFunction {
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

    // If value equals key (not found), use defaultValue
    if (value === key && defaultValue) {
      value = defaultValue;
    }

    // Simple template replacement for {param} patterns
    if (params && typeof value === 'string') {
      for (const [k, v] of Object.entries(params)) {
        if (k !== 'defaultValue') {
          value = value.replace(new RegExp(`\{${k}\}`, 'g'), String(v));
        }
      }
    }

    return value;
  }) as TranslateFunction;

  t.rich = (key: string, params?: Record<string, any>) => t(key, params);
  t.raw = (key: string) => {
    if (key.startsWith('HomePage.promptGenerator.')) {
      return getNestedValue(translations, key.replace('HomePage.promptGenerator.', ''));
    }
    return getNestedValue(translations, key);
  };

  return t;
}

export function useLocale(): string {
  return 'en';
}

export function useMessages(): any {
  return { HomePage: { promptGenerator: translations } };
}
