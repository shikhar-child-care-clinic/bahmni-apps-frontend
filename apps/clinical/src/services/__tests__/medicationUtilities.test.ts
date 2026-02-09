import {
  calculateEndDate,
  doDateRangesOverlap,
  getBaseName,
  DURATION_UNIT_TO_DAYS,
} from '../medicationUtilities';

describe('medicationUtilities', () => {
  describe('DURATION_UNIT_TO_DAYS', () => {
    it('should have correct conversion factors for all units', () => {
      expect(DURATION_UNIT_TO_DAYS['d']).toBe(1);
      expect(DURATION_UNIT_TO_DAYS['wk']).toBe(7);
      expect(DURATION_UNIT_TO_DAYS['mo']).toBe(30);
      expect(DURATION_UNIT_TO_DAYS['a']).toBe(365);
      expect(DURATION_UNIT_TO_DAYS['h']).toBe(1 / 24);
      expect(DURATION_UNIT_TO_DAYS['min']).toBe(1 / 1440);
      expect(DURATION_UNIT_TO_DAYS['s']).toBe(1 / 86400);
    });
  });

  describe('calculateEndDate', () => {
    const testDate = new Date('2024-01-15');

    it('should calculate end date correctly with day duration', () => {
      const result = calculateEndDate(testDate, 5, 'd');
      const expected = new Date('2024-01-20');
      expect(result).toEqual(expected);
    });

    it('should calculate end date correctly with week duration', () => {
      const result = calculateEndDate(testDate, 2, 'wk');
      const expected = new Date('2024-01-29');
      expect(result).toEqual(expected);
    });

    it('should calculate end date correctly with month duration', () => {
      const result = calculateEndDate(testDate, 1, 'mo');
      const expected = new Date('2024-02-14');
      expect(result).toEqual(expected);
    });

    it('should calculate end date correctly with year duration', () => {
      const result = calculateEndDate(testDate, 1, 'a');
      const expected = new Date('2025-01-14');
      expect(result).toEqual(expected);
    });

    it('should handle zero duration', () => {
      const result = calculateEndDate(testDate, 0, 'd');
      expect(result).toEqual(testDate);
    });

    it('should handle negative duration', () => {
      const result = calculateEndDate(testDate, -5, 'd');
      const expected = new Date('2024-01-10');
      expect(result).toEqual(expected);
    });

    it('should handle very large duration', () => {
      const result = calculateEndDate(testDate, 1000, 'd');
      const expected = new Date('2026-10-11');
      expect(result).toEqual(expected);
    });

    it('should handle leap year correctly', () => {
      const leapYearDate = new Date('2024-02-28');
      const result = calculateEndDate(leapYearDate, 1, 'd');
      const expected = new Date('2024-02-29');
      expect(result).toEqual(expected);
    });

    it('should accept string date input', () => {
      const result = calculateEndDate('2024-01-15', 5, 'd');
      const expected = new Date('2024-01-20');
      expect(result).toEqual(expected);
    });

    it('should handle unknown duration unit by defaulting to 1 day', () => {
      const result = calculateEndDate(testDate, 5, 'unknown');
      const expected = new Date('2024-01-20');
      expect(result).toEqual(expected);
    });

    it('should handle fractional durations with hours', () => {
      const result = calculateEndDate(testDate, 24, 'h');
      const expected = new Date('2024-01-16');
      expect(result).toEqual(expected);
    });

    it('should handle fractional durations with minutes', () => {
      const result = calculateEndDate(testDate, 1440, 'min');
      const expected = new Date('2024-01-16');
      expect(result).toEqual(expected);
    });

    it('should handle fractional durations with seconds', () => {
      const result = calculateEndDate(testDate, 86400, 's');
      const expected = new Date('2024-01-16');
      expect(result).toEqual(expected);
    });
  });

  describe('doDateRangesOverlap', () => {
    const start1 = new Date('2024-01-01');
    const end1 = new Date('2024-01-10');
    const start2 = new Date('2024-01-05');
    const end2 = new Date('2024-01-15');

    it('should return true when date ranges overlap', () => {
      expect(doDateRangesOverlap(start1, end1, start2, end2)).toBe(true);
    });

    it('should return true when one range is completely inside another', () => {
      const innerStart = new Date('2024-01-03');
      const innerEnd = new Date('2024-01-07');
      expect(doDateRangesOverlap(start1, end1, innerStart, innerEnd)).toBe(
        true,
      );
    });

    it('should return true when ranges are identical', () => {
      expect(doDateRangesOverlap(start1, end1, start1, end1)).toBe(true);
    });

    it('should return true when ranges touch at boundary (start2 equals end1)', () => {
      const boundary = new Date('2024-01-10');
      expect(doDateRangesOverlap(start1, boundary, boundary, end2)).toBe(true);
    });

    it('should return false when ranges do not overlap', () => {
      const start3 = new Date('2024-01-11');
      const end3 = new Date('2024-01-20');
      expect(doDateRangesOverlap(start1, end1, start3, end3)).toBe(false);
    });

    it('should return false when ranges are adjacent but not touching', () => {
      const start3 = new Date('2024-01-11');
      const end3 = new Date('2024-01-20');
      expect(doDateRangesOverlap(start1, end1, start3, end3)).toBe(false);
    });

    it('should handle single day ranges that overlap', () => {
      const singleDay = new Date('2024-01-05');
      expect(doDateRangesOverlap(start1, end1, singleDay, singleDay)).toBe(
        true,
      );
    });

    it('should handle single day ranges that do not overlap', () => {
      const singleDay = new Date('2024-01-11');
      expect(doDateRangesOverlap(start1, end1, singleDay, singleDay)).toBe(
        false,
      );
    });

    it('should handle year-spanning ranges', () => {
      const spanStart1 = new Date('2023-12-01');
      const spanEnd1 = new Date('2024-01-31');
      const spanStart2 = new Date('2024-01-01');
      const spanEnd2 = new Date('2024-02-28');
      expect(
        doDateRangesOverlap(spanStart1, spanEnd1, spanStart2, spanEnd2),
      ).toBe(true);
    });

    it('should handle ranges with same end date', () => {
      const sharedEnd = new Date('2024-01-10');
      const start3 = new Date('2024-01-08');
      expect(doDateRangesOverlap(start1, sharedEnd, start3, sharedEnd)).toBe(
        true,
      );
    });

    it('should correctly evaluate with reversed start/end (invalid but should still work)', () => {
      // This tests the function's behavior with invalid date ranges
      // The function doesn't validate, so reversed dates would return false
      const invalidStart = new Date('2024-01-10');
      const invalidEnd = new Date('2024-01-01');
      const validStart = new Date('2024-01-05');
      const validEnd = new Date('2024-01-15');
      expect(
        doDateRangesOverlap(invalidStart, invalidEnd, validStart, validEnd),
      ).toBe(false);
    });
  });

  describe('getBaseName', () => {
    it('should extract base name from medication with dosage', () => {
      expect(getBaseName('Amoxicillin 500mg')).toBe('amoxicillin');
    });

    it('should extract base name from medication with IU dosage', () => {
      expect(getBaseName('Vitamin A 5000 IU')).toBe('vitamin a');
    });

    it('should handle medication with parentheses', () => {
      expect(getBaseName('Paracetamol (500mg)')).toBe('paracetamol');
    });

    it('should handle medication with dosage in parentheses', () => {
      expect(getBaseName('Ibuprofen (200mg) - Store Brand')).toBe(
        'store brand',
      );
    });

    it('should handle separator format with )-', () => {
      expect(getBaseName('Medication Code (12345)- Aspirin')).toBe('aspirin');
    });

    it('should handle empty string', () => {
      expect(getBaseName('')).toBe('');
    });

    it('should handle null value', () => {
      expect(getBaseName(null as any)).toBe('');
    });

    it('should handle undefined value', () => {
      expect(getBaseName(undefined as any)).toBe('');
    });

    it('should handle medication name only without dosage', () => {
      expect(getBaseName('Paracetamol')).toBe('paracetamol');
    });

    it('should handle medication with multiple numbers', () => {
      expect(getBaseName('Lisinopril 10mg 100 tablets')).toBe('lisinopril');
    });

    it('should handle medication with hyphenated name', () => {
      expect(getBaseName('Co-Amoxiclav 500-125mg')).toBe('co-amoxiclav');
    });

    it('should handle medication with Unicode characters', () => {
      expect(getBaseName('Αμοξιλλίνη 500mg')).toBe('αμοξιλλίνη');
    });

    it('should handle medication with spaces in name', () => {
      expect(getBaseName('Acetylsalicylic Acid 325mg')).toBe(
        'acetylsalicylic acid',
      );
    });

    it('should handle medication with special characters', () => {
      expect(getBaseName('Drug-A/B Complex')).toBe('drug-a/b complex');
    });

    it('should handle very long medication name', () => {
      const longName = 'A'.repeat(500);
      expect(getBaseName(longName)).toBe(longName.toLowerCase());
    });

    it('should handle medication with only numbers', () => {
      expect(getBaseName('5000')).toBe('');
    });

    it('should handle medication with numbers and letters mixed', () => {
      expect(getBaseName('Vitamin B12')).toBe('vitamin b');
    });

    it('should handle multiple parentheses', () => {
      expect(getBaseName('Name (A) (B) 500mg')).toBe('name');
    });

    it('should handle unmatched closing parenthesis', () => {
      expect(getBaseName('Name) 500mg')).toBe('name)');
    });

    it('should normalize case to lowercase', () => {
      expect(getBaseName('PARACETAMOL 500MG')).toBe('paracetamol');
    });

    it('should trim whitespace', () => {
      expect(getBaseName('  Paracetamol  500mg  ')).toBe('paracetamol');
    });

    it('should handle medication with concentration notation', () => {
      expect(getBaseName('Metformin 500 mg/mL')).toBe('metformin');
    });

    it('should handle medication with fraction dosage', () => {
      expect(getBaseName('Aspirin 1/2 tablet')).toBe('aspirin');
    });

    it('should handle non-string input (number)', () => {
      expect(getBaseName(123 as any)).toBe('');
    });

    it('should handle non-string input (object)', () => {
      expect(getBaseName({} as any)).toBe('');
    });
  });
});
