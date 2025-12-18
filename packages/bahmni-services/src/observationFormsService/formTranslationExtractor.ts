import { FormTranslations } from './models';

/**
 * Extracts translations from API response for a specific locale
 * @param data - API response array containing translations
 * @param locale - The locale to extract translations for (e.g., 'en', 'es')
 * @returns FormTranslations object with labels and concepts
 */
export const extractFormTranslations = (
  data: unknown,
  locale: string,
): FormTranslations => {
  const defaultTranslations: FormTranslations = { labels: {}, concepts: {} };

  if (!Array.isArray(data)) {
    return defaultTranslations;
  }

  const localeData = data.find(
    (item) =>
      item &&
      typeof item === 'object' &&
      'locale' in item &&
      item.locale === locale,
  );

  if (!localeData || typeof localeData !== 'object') {
    return defaultTranslations;
  }

  return {
    labels: (localeData.labels as Record<string, string>) ?? {},
    concepts: (localeData.concepts as Record<string, string>) ?? {},
  };
};
