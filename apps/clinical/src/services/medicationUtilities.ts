import { addDays } from 'date-fns';

/**
 * Maps duration units to their equivalent in days
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
 * Extract base medication/vaccination name for comparison (ignores concentration/dosage)
 * Example: "Vitamin A 5000 IU" → "vitamin a"
 */
export const getBaseName = (fullName: string): string => {
  // Handle null/undefined/non-string values
  if (!fullName || typeof fullName !== 'string') {
    return '';
  }

  // Check for display format with ")- " separator
  const separatorMatch = fullName.match(/\)-\s*(.+)$/);
  if (separatorMatch) {
    return separatorMatch[1].trim().toLowerCase();
  }

  // Fallback: Extract name before parentheses
  const parenthesesMatch = fullName.match(/^(.+?)\s*\(/);
  if (parenthesesMatch) {
    const nameBeforeParens = parenthesesMatch[1].trim();
    const baseNameMatch = nameBeforeParens.match(
      /^([A-Za-z0-9-\s]+?)(?:\s+\d+.*)?$/,
    );
    if (baseNameMatch) {
      return baseNameMatch[1].trim().toLowerCase();
    }
    return nameBeforeParens.toLowerCase();
  }

  // If no parentheses, remove trailing numbers
  const baseNameMatch = fullName.match(/^([A-Za-z0-9-\s]+?)(?:\s+\d+.*)?$/);
  if (baseNameMatch) {
    return baseNameMatch[1].trim().toLowerCase();
  }

  return fullName.trim().toLowerCase();
};

/**
 * Calculate end date from start date and duration
 */
export const calculateEndDate = (
  startDate: Date | string,
  duration: number,
  durationUnit: string,
): Date => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const daysMultiplier = DURATION_UNIT_TO_DAYS[durationUnit] ?? 1;
  const totalDays = duration * daysMultiplier;
  return addDays(start, totalDays);
};

/**
 * Check if two date ranges overlap
 */
export const doDateRangesOverlap = (
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): boolean => {
  return start1 <= end2 && start2 <= end1;
};
