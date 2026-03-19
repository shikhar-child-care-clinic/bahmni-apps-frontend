import {
  parseISO,
  isValid,
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  addDays,
  addYears,
  addMonths,
  subYears,
  subMonths,
  subDays,
  format,
} from 'date-fns';
import type { Locale } from 'date-fns';
import { enUS, enGB, es, fr, de } from 'date-fns/locale';
import { getUserPreferredLocale } from '../i18n/translationService';
import { Age } from '../patientService/models';
import { DATE_FORMAT, DEFAULT_DATE_FORMAT_STORAGE_KEY } from './constants';
import { DATE_ERROR_MESSAGES } from './errors';

export interface FormatDateResult {
  formattedResult: string;
  error?: {
    title: string;
    message: string;
  };
}

/**
 * Mapping of user locale codes to date-fns locale objects
 */
const LOCALE_MAP: Record<string, Locale> = {
  en: enGB,
  'en-US': enUS,
  'en-GB': enGB,
  es: es,
  'es-ES': es,
  fr: fr,
  'fr-FR': fr,
  de: de,
  'de-DE': de,
};

/**
 * Gets the appropriate date-fns locale object based on user's preferred locale.
 * Falls back to English (GB) if the locale is not supported or if an error occurs.
 * @returns The date-fns locale object to use for formatting
 */
function getDateFnsLocale(): Locale {
  const userLocale = getUserPreferredLocale();
  return LOCALE_MAP[userLocale] || LOCALE_MAP['en'];
}

/**
 * Detects the browser's locale and returns an appropriate date format.
 * Uses navigator.language to determine the user's locale preference.
 * Falls back to DATE_FORMAT constant in test/Node.js environments.
 *
 * Format mapping:
 * - US locales (en-US) → MM/dd/yyyy
 * - UK/European locales (en-GB, de, fr, es, etc.) → dd/MM/yyyy
 * - Asian locales (ja, ko, zh, etc.) → yyyy-MM-dd
 * - Default fallback → DATE_FORMAT constant (dd/MM/yyyy)
 *
 * @returns Date format string based on browser locale
 */
export function getBrowserLocaleDateFormat(): string {
  try {
    if (
      typeof window === 'undefined' ||
      typeof navigator === 'undefined' ||
      !navigator.language
    ) {
      return DATE_FORMAT;
    }

    const browserLocale = navigator.language;
    if (!browserLocale) {
      return DATE_FORMAT;
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

    return DATE_FORMAT;
  } catch (error) {
    return DATE_FORMAT;
  }
}

/**
 * Calculates age based on a date string in the format yyyy-mm-dd
 * Returns age as an object with years, months, and days properties
 *
 * @param dateString - Birth date string in the format yyyy-mm-dd
 * @returns Age object containing years, months, and days or null if the input is invalid
 */
export function calculateAge(dateString: string): Age | null {
  if (
    typeof dateString !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateString)
  ) {
    return null; // Ensure input is a valid ISO date format
  }

  const birthDate = parseISO(dateString);
  if (!isValid(birthDate)) return null; // Invalid date check
  const today = new Date();
  if (birthDate > today) return null; // Future dates are invalid

  const years = differenceInYears(today, birthDate);
  const lastBirthday = addYears(birthDate, years);

  const months = differenceInMonths(today, lastBirthday);
  const lastMonthAnniversary = addMonths(lastBirthday, months);

  const days = differenceInDays(today, lastMonthAnniversary);

  return { years, months, days };
}

/**
 * Interface for date parsing results
 */
interface DateParseResult {
  date: Date | null;
  error?: {
    title: string;
    message: string;
  };
}

/**
 * Safely parses a date string into a Date object.
 * @param dateString - The date string to parse.
 * @returns A DateParseResult object containing either a valid Date or an error.
 */
function safeParseDate(
  dateString: string,
  t: (key: string, options?: { count?: number }) => string,
): DateParseResult {
  if (!dateString?.trim()) {
    return {
      date: null,
      error: {
        title: t(DATE_ERROR_MESSAGES.PARSE_ERROR),
        message: t(DATE_ERROR_MESSAGES.EMPTY_OR_INVALID),
      },
    };
  }
  const parsedDate = parseISO(dateString);
  if (!isValid(parsedDate)) {
    return {
      date: null,
      error: {
        title: t(DATE_ERROR_MESSAGES.PARSE_ERROR),
        message: t(DATE_ERROR_MESSAGES.INVALID_FORMAT),
      },
    };
  }
  return { date: parsedDate };
}

/**
 * Formats a date string or Date object into the specified date format with locale support.
 * Automatically uses the user's preferred locale from getUserPreferredLocale() for language-specific
 * formatting such as month names and day names. Falls back to English (GB) if locale retrieval fails
 * or if the locale is not supported.
 *
 * @param date - The date string or Date object to format.
 * @param dateFormat - The date format to use (e.g., 'yyyy-MM-dd', 'dd/MM/yyyy', 'MMMM dd, yyyy').
 * @returns A FormatDateResult object containing either a formatted date string or an error.
 */
function formatDateGeneric(
  date: string | Date | number,
  dateFormat: string,
  t: (key: string, options?: { count?: number }) => string,
): FormatDateResult {
  if (date === null || date === undefined) {
    return {
      formattedResult: '',
      error: {
        title: t(DATE_ERROR_MESSAGES.FORMAT_ERROR),
        message: t(DATE_ERROR_MESSAGES.NULL_OR_UNDEFINED),
      },
    };
  }

  let dateToFormat: Date | null;

  if (typeof date === 'string') {
    const parseResult = safeParseDate(date, t);
    if (parseResult.error) {
      return {
        formattedResult: '',
        error: parseResult.error,
      };
    }
    dateToFormat = parseResult.date;
  } else {
    dateToFormat = new Date(date);
  }

  if (!isValid(dateToFormat) || !dateToFormat) {
    return {
      formattedResult: '',
      error: {
        title: t(DATE_ERROR_MESSAGES.PARSE_ERROR),
        message: t(DATE_ERROR_MESSAGES.INVALID_FORMAT),
      },
    };
  }

  const locale = getDateFnsLocale();
  return { formattedResult: format(dateToFormat, dateFormat, { locale }) };
}

/**
 * Universal date/time formatting method that retrieves the date format with intelligent fallback.
 *
 * Fallback priority:
 * 1. localStorage (user-configured format)
 * 2. Browser locale (detected automatically via getBrowserLocaleDateFormat)
 * 3. DATE_FORMAT constant (final fallback)
 *
 * @param date - The date to format (string, Date object, or timestamp in milliseconds)
 * @param t - Translation function for error messages (default: identity function)
 * @param includeTime - Whether to append time to the format (default: false)
 *                      When true, always adds 12-hour time format (h:mm a)
 * @returns FormatDateResult with formatted string or error
 *
 * @example
 * // Date only (uses localStorage or browser locale)
 * formatDateTime(date) // "28/03/2024" (UK) or "03/28/2024" (US)
 *
 * @example
 * // Date with time (always 12-hour format)
 * formatDateTime(date, t, true) // "28/03/2024 2:30 PM"
 */
export function formatDateTime(
  date: string | Date | number,
  t?: (key: string, options?: { count?: number }) => string,
  includeTime: boolean = false,
): FormatDateResult {
  const translationFn = t ?? ((key: string) => key);

  let finalFormat =
    localStorage.getItem(DEFAULT_DATE_FORMAT_STORAGE_KEY) ??
    getBrowserLocaleDateFormat();

  if (includeTime) {
    finalFormat = `${finalFormat} h:mm a`;
  }

  return formatDateGeneric(date, finalFormat, translationFn);
}

/**
 * Calculates onset date by subtracting duration from given date
 * @param givenDate - The given date as baseline
 * @param durationValue - The duration value to subtract
 * @param durationUnit - The unit of duration ('days', 'months', 'years')
 * @returns Calculated onset date or undefined if inputs are invalid
 */
export function calculateOnsetDate(
  givenDate: Date,
  durationValue: number | null,
  durationUnit: 'days' | 'months' | 'years' | null,
): Date | undefined {
  if (
    !givenDate ||
    !isValid(givenDate) ||
    durationValue === null ||
    durationValue === undefined ||
    !durationUnit ||
    typeof durationValue !== 'number'
  ) {
    return undefined;
  }

  const onsetDate = new Date(givenDate);

  switch (durationUnit) {
    case 'days':
      return subDays(onsetDate, durationValue);
    case 'months':
      return subMonths(onsetDate, durationValue);
    case 'years':
      return subYears(onsetDate, durationValue);
    default:
      return undefined;
  }
}

/**
 * Formats a date string into a clean relative time format for use with i18n templates.
 * Converts all time periods to days/months/years only and removes qualifiers like "about", "almost", "ago".
 * Minutes and hours are rounded up to "1 day".
 *
 * @param date - ISO date string to format (e.g., "2025-06-17T07:02:38.000Z" or "2025-06-17")
 * @returns FormatDateResult with clean time format (e.g., "3 days", "1 month", "2 years")
 */
export function formatDateDistance(
  date: string,
  t: (key: string, options?: { count?: number }) => string,
): FormatDateResult {
  if (date === null || date === undefined) {
    return {
      formattedResult: '',
      error: {
        title: t(DATE_ERROR_MESSAGES.FORMAT_ERROR),
        message: t(DATE_ERROR_MESSAGES.NULL_OR_UNDEFINED),
      },
    };
  }

  if (typeof date !== 'string') {
    return {
      formattedResult: '',
      error: {
        title: t(DATE_ERROR_MESSAGES.FORMAT_ERROR),
        message: t(DATE_ERROR_MESSAGES.INVALID_FORMAT),
      },
    };
  }

  const parseResult = safeParseDate(date, t);
  if (parseResult.error) {
    return {
      formattedResult: '',
      error: parseResult.error,
    };
  }

  const now = new Date();

  // Calculate differences in various units
  const diffInMilliseconds = now.getTime() - parseResult.date!.getTime();
  const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));
  const diffInMonths = differenceInMonths(now, parseResult.date!);
  const diffInYears = differenceInYears(now, parseResult.date!);

  let formattedResult: string;

  if (diffInYears >= 5) {
    const monthInFraction = diffInMonths % 12;
    const yearValue = monthInFraction > 6 ? diffInYears + 1 : diffInYears;
    const yearUnit = t('YEARS_FULL_FORMAT', {
      count: yearValue,
    });
    formattedResult = `${yearValue} ${yearUnit}`;
  } else if (diffInYears >= 1) {
    // Use years for periods >= 1 year
    const monthInFraction = diffInMonths % 12;
    const yearUnit = t('YEARS_FULL_FORMAT', {
      count: diffInYears + monthInFraction,
    });
    const newLocal = diffInYears + 1;
    formattedResult =
      monthInFraction === 0
        ? `${diffInYears} ${yearUnit}`
        : monthInFraction > 6
          ? `${newLocal} ${yearUnit}`
          : `${diffInYears}.5 ${yearUnit}`;
  } else if (diffInMonths >= 11) {
    const yearUnit = t('YEARS_FULL_FORMAT', {
      count: 1,
    });
    formattedResult = `1 ${yearUnit}`;
  } else if (diffInMonths >= 1) {
    // Use months for periods >= 1 month but < 1 year
    const daysInFraction = diffInDays % 30;
    const monthValue = daysInFraction > 15 ? diffInMonths + 1 : diffInMonths;
    const monthUnit = t('MONTHS_FULL_FORMAT', {
      count: monthValue,
    });
    formattedResult = `${monthValue} ${monthUnit}`;
  } else {
    // Use days for everything else (including hours, minutes - round up to at least 1 day)
    const days = Math.max(1, diffInDays);
    const dayUnit = t('DAYS_FULL_FORMAT', {
      count: days,
    });
    formattedResult = `${days} ${dayUnit}`;
  }

  return { formattedResult };
}

export const getTodayDate = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Direct mapping of common date-fns formats to flatpickr formats.
 * This lookup map approach is more reliable than regex replacement.
 *
 * Flatpickr format tokens:
 * - d: Day of month (1-31)
 * - m: Month (01-12)
 * - n: Month (1-12)
 * - Y: 4-digit year
 * - y: 2-digit year
 * - M: Short month name (Jan, Feb, etc.)
 * - F: Full month name (January, February, etc.)
 * - H: Hours 24-hour (00-23)
 * - h: Hours 12-hour (01-12)
 * - i: Minutes (00-59)
 * - S: Seconds (00-59)
 * - K: AM/PM
 */
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

  'dd/MM/yyyy HH:mm': 'd/m/Y H:i',
  'dd-MM-yyyy HH:mm': 'd-m-Y H:i',
  'MM/dd/yyyy HH:mm': 'm/d/Y H:i',
  'yyyy-MM-dd HH:mm': 'Y-m-d H:i',
  'dd/MM/yyyy hh:mm a': 'd/m/Y h:i K',
  'MM/dd/yyyy hh:mm a': 'm/d/Y h:i K',
  'dd/MM/yyyy h:mm a': 'd/m/Y g:i K',
  'MM/dd/yyyy h:mm a': 'm/d/Y g:i K',

  'do MMM, yyyy': 'jS M, Y',
};

/**
 * Converts date-fns format to flatpickr/Carbon DatePicker format.
 * Uses a lookup map for known formats, which is more reliable than regex replacement.
 *
 * @param dateFnsFormat - date-fns format string (e.g., 'dd/MM/yyyy')
 * @returns flatpickr format string (e.g., 'd/m/Y')
 *
 * @example
 * convertDateFnsToFlatpickr('dd/MM/yyyy')  // returns 'd/m/Y'
 */
export function convertDateFnsToFlatpickr(dateFnsFormat: string): string {
  const flatpickrFormat = DATE_FORMAT_MAP[dateFnsFormat];

  if (flatpickrFormat) {
    return flatpickrFormat;
  }
  return dateFnsFormat;
}

/**
 * Gets the Carbon DatePicker compatible format with intelligent fallback.
 *
 * Fallback priority:
 * 1. localStorage (user-configured format)
 * 2. Browser locale (detected automatically via getBrowserLocaleDateFormat)
 * 3. DATE_FORMAT constant (final fallback)
 *
 * @returns Flatpickr format string for use with Carbon DatePicker
 *
 * @example
 * getDatePickerFormat() // returns 'd/m/Y' (UK) or 'm/d/Y' (US) based on browser locale
 */
export const getDatePickerFormat = (): string => {
  const dateFnsFormat =
    localStorage.getItem(DEFAULT_DATE_FORMAT_STORAGE_KEY) ??
    getBrowserLocaleDateFormat();
  return convertDateFnsToFlatpickr(dateFnsFormat);
};

/**
 * Calculate and format age for display.
 * For infants under 3 months, displays age in total days only.
 * For all others, displays age in years, months, and days format.
 *
 * @param birthDate - Birth date in milliseconds (timestamp) or ISO date string (yyyy-mm-dd)
 * @param t - Optional translation function for Y/M/D labels
 * @param format - Format type: 'short' (e.g., "25y 6m 15d") or 'full' (e.g., "25 Years, 6 Months, 15 Days")
 * @returns Formatted age string
 */
export function calculateAgeinYearsAndMonths(
  birthDate: number | string,
  t?: (key: string, options?: { count?: number }) => string,
  format: 'short' | 'full' = 'short',
): string {
  const birthDateObj =
    typeof birthDate === 'string' ? parseISO(birthDate) : new Date(birthDate);
  const today = new Date();

  const years = differenceInYears(today, birthDateObj);
  const lastBirthday = addYears(birthDateObj, years);
  const months = differenceInMonths(today, lastBirthday);
  const lastMonthAnniversary = addMonths(lastBirthday, months);
  const days = differenceInDays(today, lastMonthAnniversary);

  const isFullFormat = format === 'full';

  // For infants under 3 months, show total days only
  if (years === 0 && months < 3) {
    const totalDays = differenceInDays(today, birthDateObj);
    if (!t) {
      return isFullFormat ? `${totalDays} days` : `${totalDays}d`;
    }
    const dayKey = isFullFormat ? 'DAYS_FULL_FORMAT' : 'DAYS_SHORT_FORMAT';
    const dayUnit = t(dayKey, { count: totalDays });
    const separator = isFullFormat ? ' ' : '';
    return `${totalDays}${separator}${dayUnit}`;
  }

  if (!t) {
    if (isFullFormat) {
      return `${years} years ${months} months ${days} days`;
    }
    return `${years}y ${months}m ${days}d`;
  }

  const yearKey = isFullFormat ? 'YEARS_FULL_FORMAT' : 'YEARS_SHORT_FORMAT';
  const monthKey = isFullFormat ? 'MONTHS_FULL_FORMAT' : 'MONTHS_SHORT_FORMAT';
  const dayKey = isFullFormat ? 'DAYS_FULL_FORMAT' : 'DAYS_SHORT_FORMAT';

  const ageComponents: Array<[number, string]> = [
    [years, yearKey],
    [months, monthKey],
    [days, dayKey],
  ];

  const separator = isFullFormat ? ' ' : '';
  const parts = ageComponents
    .filter(([value]) => value > 0)
    .map(([value, key]) => {
      const unit = t(key, { count: value });
      return `${value}${separator}${unit}`;
    });

  if (parts.length > 0) {
    return parts.join(' ');
  }

  const zeroUnit = t(dayKey, { count: 0 });
  return isFullFormat ? `0 ${zeroUnit}` : '0d';
}
/**
 * Sorts an array of objects by a date field
 * @param array - Array of objects to sort
 * @param dateField - The field name containing the date value
 * @param ascending - Sort order: true for ascending (oldest first), false for descending (newest first)
 * @returns sorted array
 */
/**
 * Mapping of FHIR/UCUM duration unit codes to their equivalent in days.
 * Used to convert duration values into a common unit for date calculations.
 */
export const DURATION_UNIT_TO_DAYS: Record<string, number> = {
  d: 1,
  wk: 7,
  mo: 30,
  a: 365,
  h: 1 / 24,
  min: 1 / 1440,
  s: 1 / 86400,
};

/**
 * Calculates an end date by adding a duration to a start date.
 * @param startDate - The start date (Date object or ISO string)
 * @param duration - The duration value
 * @param durationUnit - The FHIR/UCUM duration unit code (e.g., 'd', 'wk', 'mo')
 * @returns The calculated end date
 * @throws Error if the start date is invalid
 */
export const calculateEndDate = (
  startDate: Date | string,
  duration: number,
  durationUnit: string,
): Date => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  // Validate that the date is valid
  if (isNaN(start.getTime())) {
    throw new Error(`Invalid date: ${startDate}`);
  }
  const daysMultiplier = DURATION_UNIT_TO_DAYS[durationUnit] ?? 1;
  const totalDays = duration * daysMultiplier;
  return addDays(start, totalDays);
};

/**
 * Checks whether two date ranges overlap.
 * Uses inclusive comparison: ranges that share an endpoint are considered overlapping.
 */
export const doDateRangesOverlap = (
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): boolean => {
  return start1 <= end2 && start2 <= end1;
};

export function sortByDate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  array: any[],
  dateField: string,
  ascending: boolean = false,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  if (!array || !Array.isArray(array)) return [];

  return array.sort((a, b) => {
    const dateA = new Date(a[dateField]);
    const dateB = new Date(b[dateField]);

    // Handle invalid dates
    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;

    const diff = dateA.getTime() - dateB.getTime();
    return ascending ? diff : -diff;
  });
}
