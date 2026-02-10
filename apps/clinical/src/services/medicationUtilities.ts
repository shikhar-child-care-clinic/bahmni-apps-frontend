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

  // Check for display format with ")- " separator (handles "Code (123)- Medication Name")
  // Allows optional whitespace around ) and -
  const separatorMatch = fullName.match(/\)\s*-\s*(.+)$/);
  if (separatorMatch) {
    return separatorMatch[1].trim().toLowerCase();
  }

  // Fallback: Extract name before parentheses
  const parenthesesMatch = fullName.match(/^(.+?)\s*\(/);
  if (parenthesesMatch) {
    let baseName = parenthesesMatch[1].trim();
    // Remove trailing numbers/dosage: space followed by digits/decimals OR digits at the end
    baseName = baseName.replace(/\s+[\d.]+.*$/g, '').trim();
    baseName = baseName.replace(/\d+$/g, '').trim();
    // Only lowercase if it contains non-digit characters (handles "only numbers" case)
    if (baseName && !/^\d+$/.test(baseName)) {
      return baseName.toLowerCase();
    }
    return '';
  }

  // If no parentheses, remove trailing numbers (handles "Vitamin A 5000 IU" → "vitamin a")
  let baseName = fullName;
  // Remove anything that looks like dosage: space followed by numbers/decimals
  baseName = baseName.replace(/\s+[\d.]+.*$/g, '').trim();
  // Also remove trailing digits even if not preceded by space (handles "B12" → "B")
  baseName = baseName.replace(/\d+$/g, '').trim();
  // Only lowercase if it contains non-digit characters (handles "only numbers" case)
  if (baseName && !/^\d+$/.test(baseName)) {
    return baseName.toLowerCase();
  }
  return '';
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
  // Validate that the date is valid
  if (isNaN(start.getTime())) {
    throw new Error(`Invalid date: ${startDate}`);
  }
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
