import { addDays } from 'date-fns';
import {
  Medication,
  MedicationRequest as FhirMedicationRequest,
} from 'fhir/r4';

import { MedicationInputEntry } from '../../models/medication';

import { FHIRCode, extractCodesFromConcept } from './codeUtilities';

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

export const extractMedicationCodes = (
  medication: CodeableResource | unknown,
): FHIRCode[] => {
  const codes: FHIRCode[] = [];
  const resource = medication as CodeableResource;

  // Extract from code field (Medication resource)
  if (resource?.code) {
    codes.push(...extractCodesFromConcept(resource.code));
  }

  // Extract from medicationCodeableConcept (MedicationRequest)
  if (resource?.medicationCodeableConcept) {
    codes.push(...extractCodesFromConcept(resource.medicationCodeableConcept));
  }

  return codes;
};

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

export const doDateRangesOverlap = (
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): boolean => {
  return start1 <= end2 && start2 <= end1;
};

/**
 * Safely extract medication ID from FHIR medicationReference
 * Returns undefined if reference is malformed or missing
 */
export const extractMedicationRefId = (
  reference: string | undefined,
): string | undefined => {
  if (!reference) return undefined;
  const parts = reference.split('/');
  // Expected format: "Medication/123" - need exactly 2 parts
  if (parts.length !== 2 || !parts[1]) return undefined;
  return parts[1];
};

// Extract dose form from Medication resource or display name
export const extractDoseForm = (
  medication: Record<string, unknown>,
  displayName: string,
): string | undefined => {
  // Try to extract from Medication resource's form property
  const form = medication?.form as Record<string, unknown>;
  const coding = form?.coding as Array<Record<string, unknown>>;
  let doseForm =
    (form?.text as string | undefined) ??
    (coding?.[0]?.display as string | undefined) ??
    undefined;

  // Fallback: extract from displayName if form info is embedded there
  if (!doseForm && displayName) {
    const formMatch = displayName.match(/\(([^)]+)\)/);
    if (formMatch?.[1]) {
      const extracted = formMatch[1].trim();
      // Only use if it looks like a form (not a dosage like "500mg")
      if (!/^\d+/.test(extracted)) {
        doseForm = extracted;
      }
    }
  }

  return doseForm;
};

// Check if any selected medications overlap with each other or with existing active medications
export const checkMedicationsOverlap = (
  selectedMedications: MedicationInputEntry[],
  activeMedications: FhirMedicationRequest[],
  medicationMap: Record<string, Medication>,
): boolean => {
  for (let i = 0; i < selectedMedications.length; i++) {
    const current = selectedMedications[i];

    if (!current.startDate) continue;

    // Check against other selected medications
    for (let j = i + 1; j < selectedMedications.length; j++) {
      const other = selectedMedications[j];

      if (!medicationsMatchByCode(current.medication, other.medication)) {
        continue;
      }

      if (current.isSTAT || other.isSTAT) {
        return true;
      }

      if (current.isPRN || other.isPRN) {
        continue;
      }

      if (!other.startDate) continue;

      const currentStart = new Date(current.startDate);
      const currentEnd = calculateEndDate(
        currentStart,
        current.duration > 0 ? current.duration : 1,
        current.durationUnit?.code ?? 'd',
      );

      const otherStart = new Date(other.startDate);
      const otherEnd = calculateEndDate(
        otherStart,
        other.duration > 0 ? other.duration : 1,
        other.durationUnit?.code ?? 'd',
      );

      if (doDateRangesOverlap(currentStart, currentEnd, otherStart, otherEnd)) {
        return true;
      }
    }

    // Check against existing backend medications
    const isExistingOverlap = activeMedications.some(
      (med: FhirMedicationRequest) => {
        const refId = extractMedicationRefId(
          med.medicationReference?.reference,
        );
        const medicationResource = refId ? medicationMap[refId] : null;

        if (
          !medicationResource ||
          !medicationsMatchByCode(current.medication, medicationResource)
        ) {
          return false;
        }

        const isImmediate = med.priority === 'stat';
        const isPRN = med.dosageInstruction?.[0]?.asNeededBoolean ?? false;
        const startDate =
          med.dosageInstruction?.[0]?.timing?.event?.[0] ?? med.authoredOn;
        const duration =
          med.dosageInstruction?.[0]?.timing?.repeat?.duration ?? 7;
        const durationUnit =
          med.dosageInstruction?.[0]?.timing?.repeat?.durationUnit ?? 'd';

        if (isImmediate || current.isSTAT) return true;
        if (isPRN || current.isPRN) return false;
        if (!startDate || !current.startDate) return false;

        const existingStart = new Date(startDate);
        const existingEnd = calculateEndDate(
          existingStart,
          duration,
          durationUnit,
        );

        const currentStart = new Date(current.startDate);
        const currentEnd = calculateEndDate(
          currentStart,
          current.duration > 0 ? current.duration : 1,
          current.durationUnit?.code ?? 'd',
        );

        return doDateRangesOverlap(
          existingStart,
          existingEnd,
          currentStart,
          currentEnd,
        );
      },
    );

    if (isExistingOverlap) return true;
  }

  return false;
};

// Check if a new medication would be a duplicate of existing or selected medications
export const isDuplicateMedication = (
  newMedication: Medication,
  newStartDate: Date,
  newDuration: number,
  newDurationUnit: string,
  activeMedications: FhirMedicationRequest[],
  selectedMedications: MedicationInputEntry[],
  medicationMap: Record<string, Medication>,
): boolean => {
  const effectiveDuration = newDuration > 0 ? newDuration : 1;
  const effectiveUnit = newDurationUnit ?? 'd';
  const newEndDate = calculateEndDate(
    newStartDate,
    effectiveDuration,
    effectiveUnit,
  );

  const isExistingDuplicate = activeMedications.some(
    (med: FhirMedicationRequest) => {
      const refId = extractMedicationRefId(med.medicationReference?.reference);
      const medicationResource = refId ? medicationMap[refId] : null;

      if (
        !medicationResource ||
        !medicationsMatchByCode(newMedication, medicationResource)
      ) {
        return false;
      }

      const isImmediate = med.priority === 'stat';
      const startDate =
        med.dosageInstruction?.[0]?.timing?.event?.[0] ?? med.authoredOn;

      if (isImmediate) {
        return true;
      }

      if (!startDate) {
        return false;
      }

      const existingDuration =
        med.dosageInstruction?.[0]?.timing?.repeat?.duration ?? 7;
      const existingDurationUnit =
        med.dosageInstruction?.[0]?.timing?.repeat?.durationUnit ?? 'd';

      const existingStartDate = new Date(startDate);
      const existingEndDate = calculateEndDate(
        existingStartDate,
        existingDuration,
        existingDurationUnit,
      );

      return doDateRangesOverlap(
        existingStartDate,
        existingEndDate,
        newStartDate,
        newEndDate,
      );
    },
  );

  const isSelectedDuplicate = selectedMedications.some(
    (selected: MedicationInputEntry) => {
      return medicationsMatchByCode(newMedication, selected.medication);
    },
  );

  return isExistingDuplicate || isSelectedDuplicate;
};
