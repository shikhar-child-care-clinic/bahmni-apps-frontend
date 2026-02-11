import { addDays } from 'date-fns';
import {
  calculateEndDate,
  doDateRangesOverlap,
  extractMedicationCodes,
  getBaseName,
  medicationsMatchByCode,
  DURATION_UNIT_TO_DAYS,
  extractDoseForm,
} from '../medicationUtilities';

describe('Medication Utilities', () => {
  describe('DURATION_UNIT_TO_DAYS', () => {
    test('contains all expected duration unit conversions', () => {
      expect(DURATION_UNIT_TO_DAYS).toEqual({
        d: 1,
        wk: 7,
        mo: 30,
        a: 365,
        h: 1 / 24,
        min: 1 / 1440,
        s: 1 / 86400,
      });
    });
  });

  describe('extractMedicationCodes', () => {
    test('extracts codes from Medication.code field', () => {
      const medication = {
        id: 'med-1',
        code: {
          text: 'Paracetamol 500mg',
          coding: [
            {
              code: 'paracetamol-500',
              system: 'http://snomed.info/sct',
              display: 'Paracetamol 500 mg',
            },
          ],
        },
      };

      const codes = extractMedicationCodes(medication);

      expect(codes).toHaveLength(1);
      expect(codes[0]).toEqual({
        code: 'paracetamol-500',
        system: 'http://snomed.info/sct',
      });
    });

    test('extracts codes from MedicationRequest.medicationCodeableConcept', () => {
      const medicationRequest = {
        id: 'mr-1',
        medicationCodeableConcept: {
          coding: [
            {
              code: 'aspirin-100',
              system: 'http://snomed.info/sct',
            },
          ],
        },
      };

      const codes = extractMedicationCodes(medicationRequest);

      expect(codes).toHaveLength(1);
      expect(codes[0].code).toBe('aspirin-100');
    });

    test('matches medications with complex names using FHIR codes', () => {
      const med1 = {
        id: 'med-1',
        code: {
          text: 'Sulphadoxine - Pyrimethamine (250 mg + 12.5 mg)',
          coding: [
            {
              code: '398770008',
              system: 'http://snomed.info/sct',
              display: 'Sulfamethoxazole-trimethoprim',
            },
          ],
        },
      };

      const med2 = {
        id: 'med-2',
        code: {
          text: 'Trimethoprim-Sulfamethoxazole 250/50mg',
          coding: [
            {
              code: '398770008',
              system: 'http://snomed.info/sct',
              display: 'Sulfamethoxazole-trimethoprim',
            },
          ],
        },
      };

      const matches = medicationsMatchByCode(med1, med2);

      expect(matches).toBe(true);
    });

    test('returns empty array when medication is undefined', () => {
      const codes = extractMedicationCodes(undefined);

      expect(codes).toEqual([]);
    });
  });

  describe('medicationsMatchByCode', () => {
    test('matches medications with identical SNOMED codes', () => {
      const med1 = {
        id: 'med-1',
        code: {
          coding: [
            {
              code: 'paracetamol-500',
              system: 'http://snomed.info/sct',
            },
          ],
        },
      };

      const med2 = {
        id: 'med-2',
        code: {
          coding: [
            {
              code: 'paracetamol-500',
              system: 'http://snomed.info/sct',
            },
          ],
        },
      };

      const matches = medicationsMatchByCode(med1, med2);

      expect(matches).toBe(true);
    });

    test('does not match medications with different codes', () => {
      const med1 = {
        id: 'med-1',
        code: {
          coding: [
            {
              code: 'paracetamol-500',
              system: 'http://snomed.info/sct',
            },
          ],
        },
      };

      const med2 = {
        id: 'med-2',
        code: {
          coding: [
            {
              code: 'ibuprofen-400',
              system: 'http://snomed.info/sct',
            },
          ],
        },
      };

      const matches = medicationsMatchByCode(med1, med2);

      expect(matches).toBe(false);
    });

    test('matches OpenMRS concepts by code value alone', () => {
      const med1 = {
        id: 'med-1',
        code: {
          coding: [
            {
              code: '5000',
            },
          ],
        },
      };

      const med2 = {
        id: 'med-2',
        code: {
          coding: [
            {
              code: '5000',
            },
          ],
        },
      };

      const matches = medicationsMatchByCode(med1, med2);

      expect(matches).toBe(true);
    });
  });

  describe('doDateRangesOverlap', () => {
    test('detects overlap when ranges overlap in the middle', () => {
      const start1 = new Date('2025-01-01');
      const end1 = new Date('2025-01-10');
      const start2 = new Date('2025-01-05');
      const end2 = new Date('2025-01-15');

      const overlaps = doDateRangesOverlap(start1, end1, start2, end2);

      expect(overlaps).toBe(true);
    });

    test('detects no overlap when ranges are separate', () => {
      const start1 = new Date('2025-01-01');
      const end1 = new Date('2025-01-05');
      const start2 = new Date('2025-01-10');
      const end2 = new Date('2025-01-15');

      const overlaps = doDateRangesOverlap(start1, end1, start2, end2);

      expect(overlaps).toBe(false);
    });

    test('detects overlap when ranges touch at edges', () => {
      const start1 = new Date('2025-01-01');
      const end1 = new Date('2025-01-10');
      const start2 = new Date('2025-01-10');
      const end2 = new Date('2025-01-15');

      const overlaps = doDateRangesOverlap(start1, end1, start2, end2);

      expect(overlaps).toBe(true);
    });
  });

  describe('calculateEndDate', () => {
    test('calculates end date with day duration', () => {
      const startDate = new Date('2025-01-01');
      const endDate = calculateEndDate(startDate, 7, 'd');

      expect(endDate).toEqual(addDays(startDate, 7));
    });

    test('calculates end date with week duration', () => {
      const startDate = new Date('2025-01-01');
      const endDate = calculateEndDate(startDate, 2, 'wk');

      expect(endDate).toEqual(addDays(startDate, 14));
    });

    test('throws error for invalid date', () => {
      expect(() => calculateEndDate('invalid-date', 7, 'd')).toThrow(
        'Invalid date',
      );
    });
  });

  describe('getBaseName', () => {
    test('extracts base name from string with dosage', () => {
      const baseName = getBaseName('Vitamin A 5000 IU');

      expect(baseName).toBe('vitamin a');
    });

    test('extracts base name from string with parentheses', () => {
      const baseName = getBaseName('Paracetamol (Tablet) 500mg');

      expect(baseName).toBe('paracetamol');
    });

    test('handles null/undefined values', () => {
      expect(getBaseName(null as any)).toBe('');
      expect(getBaseName(undefined as any)).toBe('');
    });

    test('lowercases the result', () => {
      const baseName = getBaseName('PARACETAMOL 500mg');

      expect(baseName).toBe('paracetamol');
    });
  });

  describe('extractDoseForm', () => {
    test('extracts from form.text', () => {
      const medication = { form: { text: 'Tablet' } };
      expect(extractDoseForm(medication, 'Paracetamol')).toBe('Tablet');
    });

    test('extracts from form.coding[0].display', () => {
      const medication = { form: { coding: [{ display: 'Capsule' }] } };
      expect(extractDoseForm(medication, 'Aspirin')).toBe('Capsule');
    });

    test('extracts from display name as fallback', () => {
      expect(extractDoseForm({}, 'Paracetamol (Tablet) - 500mg')).toBe(
        'Tablet',
      );
    });

    test('does not extract numeric values', () => {
      expect(extractDoseForm({}, 'Medication (500mg)')).toBeUndefined();
    });

    test('prefers form property over display name', () => {
      const medication = { form: { text: 'Capsule' } };
      expect(extractDoseForm(medication, 'Paracetamol (Tablet) - 500mg')).toBe(
        'Capsule',
      );
    });
  });
});
