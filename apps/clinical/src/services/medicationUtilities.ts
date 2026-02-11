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
 * Represents a FHIR code from CodeableConcept
 */
export interface FHIRCode {
  system?: string;
  code: string;
}

/**
 * Generic type for FHIR resources or objects with optional code properties
 */
interface CodeableResource {
  code?: {
    coding?: Array<{
      system?: string;
      code?: string;
    }>;
  };
  medicationCodeableConcept?: {
    coding?: Array<{
      system?: string;
      code?: string;
    }>;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Extract all medication codes from FHIR CodeableConcept
 * Uses actual FHIR code data - no string parsing
 * Handles both Medication.code and MedicationRequest.medicationCodeableConcept
 */
export const extractMedicationCodes = (
  medication: CodeableResource | unknown,
): FHIRCode[] => {
  const codes: FHIRCode[] = [];
  const resource = medication as CodeableResource;

  // Extract from code field (Medication resource)
  if (resource?.code?.coding && Array.isArray(resource.code.coding)) {
    resource.code.coding.forEach((coding) => {
      if (coding.code) {
        codes.push({
          system: coding.system,
          code: coding.code,
        });
      }
    });
  }

  // Extract from medicationCodeableConcept (MedicationRequest)
  if (
    resource?.medicationCodeableConcept?.coding &&
    Array.isArray(resource.medicationCodeableConcept.coding)
  ) {
    resource.medicationCodeableConcept.coding.forEach((coding) => {
      if (coding.code) {
        codes.push({
          system: coding.system,
          code: coding.code,
        });
      }
    });
  }

  return codes;
};

/**
 * Check if two medications match by comparing FHIR codes
 * Returns true if any code matches (same system + code value)
 * For OpenMRS concepts (no system), matches by code value alone
 */
export const medicationsMatchByCode = (
  medication1: CodeableResource | unknown,
  medication2: CodeableResource | unknown,
): boolean => {
  const codes1 = extractMedicationCodes(medication1);
  const codes2 = extractMedicationCodes(medication2);

  if (codes1.length === 0 || codes2.length === 0) {
    return false;
  }

  // Check for exact code matches (same system + code)
  for (const c1 of codes1) {
    for (const c2 of codes2) {
      if (c1.code === c2.code && c1.system === c2.system) {
        return true;
      }
    }
  }

  // For OpenMRS concept codes (no system), match by code value alone
  for (const c1 of codes1) {
    if (!c1.system) {
      for (const c2 of codes2) {
        if (!c2.system && c1.code === c2.code) {
          return true;
        }
      }
    }
  }

  return false;
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
