const DEFAULT_DATE_FORMAT_STORAGE_KEY = 'default_dateFormat';
const DEFAULT_DATE_FORMAT = 'dd/MM/yyyy';

// Date format mapping from date-fns format to flatpickr format
const DATE_FORMAT_MAP: Record<string, string> = {
  'dd/MM/yyyy': 'd/m/Y',
  'dd-MM-yyyy': 'd-m-Y',
  'dd.MM.yyyy': 'd.m.Y',
  'dd MM yyyy': 'd m Y',
  'dd-MMM-yyyy': 'd-M-Y',
  'dd/MMM/yyyy': 'd/M/Y',
  'dd MMM yyyy': 'd M Y',
  'dd-MMM-yy': 'd-M-y',
  'dd-MMMM-yyyy': 'd-F-Y',
  'dd/MMMM/yyyy': 'd/F/Y',
  'dd MMMM yyyy': 'd F Y',
  'MM/dd/yyyy': 'm/d/Y',
  'MM-dd-yyyy': 'm-d-Y',
  'MM.dd.yyyy': 'm.d.Y',
  'MM dd yyyy': 'm d Y',
  'MMM-dd-yyyy': 'M-d-Y',
  'MMM/dd/yyyy': 'M/d/Y',
  'MMM dd, yyyy': 'M d, Y',
  'MMMM dd, yyyy': 'F d, Y',
  'MMMM-dd-yyyy': 'F-d-Y',
  'yyyy-MM-dd': 'Y-m-d',
  'yyyy/MM/dd': 'Y/m/d',
  'yyyy.MM.dd': 'Y.m.d',
  'yyyy MM dd': 'Y m d',
  'yyyy-MMM-dd': 'Y-M-d',
  'yyyy/MMM/dd': 'Y/M/d',
  'yyyy-MMMM-dd': 'Y-F-d',
  'd/M/yyyy': 'j/n/Y',
  'd-M-yyyy': 'j-n-Y',
  'd.M.yyyy': 'j.n.Y',
  'M/d/yyyy': 'n/j/Y',
  'M-d-yyyy': 'n-j-Y',
  'dd/MM/yy': 'd/m/y',
  'dd-MM-yy': 'd-m-y',
  'MM/dd/yy': 'm/d/y',
  'MM-dd-yy': 'm-d-y',
  'yy-MM-dd': 'y-m-d',
  'd/M/yy': 'j/n/y',
  'M/d/yy': 'n/j/y',
  'do MMM, yyyy': 'jS M, Y',
};

/**
 * Detects the browser's locale and returns an appropriate date format.
 * Uses navigator.language to determine the user's locale preference.
 * Falls back to DEFAULT_DATE_FORMAT in test/Node.js environments.
 *
 * Format mapping:
 * - US locales (en-US) → MM/dd/yyyy
 * - UK/European locales (en-GB, de, fr, es, etc.) → dd/MM/yyyy
 * - Asian locales (ja, ko, zh, etc.) → yyyy-MM-dd
 * - Default fallback → DEFAULT_DATE_FORMAT (dd/MM/yyyy)
 *
 * @returns Date format string based on browser locale
 */
export function getBrowserLocaleDateFormat(): string {
  try {
    if (
      globalThis.window === undefined ||
      typeof navigator === 'undefined' ||
      !navigator.language
    ) {
      return DEFAULT_DATE_FORMAT;
    }

    const browserLocale = navigator.language;
    if (!browserLocale) {
      return DEFAULT_DATE_FORMAT;
    }

    const locale = browserLocale.toLowerCase();

    if (locale === 'en-us') {
      return 'MM/dd/yyyy';
    }

    if (
      locale.startsWith('ja') ||
      locale.startsWith('ko') ||
      locale.startsWith('zh') ||
      locale.startsWith('vi')
    ) {
      return 'yyyy-MM-dd';
    }

    return DEFAULT_DATE_FORMAT;
  } catch {
    return DEFAULT_DATE_FORMAT;
  }
}

/**
 * Converts date-fns format to flatpickr/Carbon DatePicker format.
 * Uses a lookup map for known formats.
 *
 * @param dateFnsFormat - date-fns format string (e.g., 'dd/MM/yyyy')
 * @returns flatpickr format string (e.g., 'd/m/Y')
 */
export function convertToFlatpickrFormat(dateFnsFormat: string): string {
  return DATE_FORMAT_MAP[dateFnsFormat] || dateFnsFormat;
}

/**
 * Gets the date format with intelligent fallback.
 *
 * Fallback priority:
 * 1. localStorage (user-configured format)
 * 2. Browser locale (detected automatically via getBrowserLocaleDateFormat)
 * 3. DEFAULT_DATE_FORMAT constant (final fallback)
 *
 * @returns Object containing both date-fns format and flatpickr format
 */
export function getDateFormats(): {
  dateFnsFormat: string;
  flatpickrFormat: string;
} {
  let dateFnsFormat: string;
  try {
    dateFnsFormat =
      localStorage.getItem(DEFAULT_DATE_FORMAT_STORAGE_KEY) ??
      getBrowserLocaleDateFormat();
  } catch {
    dateFnsFormat = getBrowserLocaleDateFormat();
  }

  const flatpickrFormat = convertToFlatpickrFormat(dateFnsFormat);

  return { dateFnsFormat, flatpickrFormat };
}

export { DEFAULT_DATE_FORMAT };
