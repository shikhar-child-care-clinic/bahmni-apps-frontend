import { createMedicationBundleEntry } from '../utils';
import {
  medicationEntryWithAllFields,
  minimalMedicationEntry,
} from './__mocks__/medicationMocks';

describe('createMedicationBundleEntry', () => {
  it.each([
    ['no arguments', undefined],
    ['an empty object', {}],
  ])('returns a minimal valid BundleEntry when called with %s', (_, input) => {
    expect(createMedicationBundleEntry(input)).toEqual(minimalMedicationEntry);
  });

  it('places fullUrl on the BundleEntry wrapper, not the resource', () => {
    const fullUrl = 'urn:uuid:med-uuid-123';

    const result = createMedicationBundleEntry({ fullUrl });

    expect(result.fullUrl).toBe(fullUrl);
    expect(result.resource?.['fullUrl']).toBeUndefined();
  });

  it('omits fullUrl from the BundleEntry when not provided', () => {
    const result = createMedicationBundleEntry({ id: 'med-123' });

    expect(result).not.toHaveProperty('fullUrl');
  });

  it.each([
    ['id', { id: 'med-uuid-123' }],
    ['meta', { meta: { versionId: '1' } }],
    ['status', { status: 'active' as const }],
    ['manufacturer', { manufacturer: { reference: 'Organization/org-123' } }],
    ['code', { code: medicationEntryWithAllFields.resource!.code }],
    [
      'form',
      {
        form: {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '385055001',
              display: 'Tablet',
            },
          ],
        },
      },
    ],
    [
      'amount',
      {
        amount: {
          numerator: { value: 500, unit: 'mg' },
          denominator: { value: 1, unit: 'tablet' },
        },
      },
    ],
    [
      'identifier',
      {
        identifier: [
          { system: 'http://example.org/medications', value: 'MED-001' },
        ],
      },
    ],
    [
      'batch',
      { batch: { lotNumber: 'LOT-2024-001', expirationDate: '2026-12-31' } },
    ],
    [
      'ingredient',
      { ingredient: medicationEntryWithAllFields.resource!.ingredient },
    ],
  ])('places %s on the resource', (_, input) => {
    const result = createMedicationBundleEntry(input);

    expect(result.resource).toMatchObject({
      resourceType: 'Medication',
      ...input,
    });
  });

  it('builds a complete entry with all fields', () => {
    const { fullUrl, resource } = medicationEntryWithAllFields;
    const { resourceType, ...medicationFields } = resource!;

    const result = createMedicationBundleEntry({
      fullUrl,
      ...medicationFields,
    });

    expect(result).toEqual(medicationEntryWithAllFields);
  });
});
