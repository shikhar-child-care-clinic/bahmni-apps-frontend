import { createMedicationDispenseBundleEntry } from '../utils';
import {
  medicationDispenseEntryWithAllFields,
  minimalMedicationDispenseEntry,
  minimalMedicationDispenseEntryWithReference,
} from './__mocks__/medicationDispenseMocks';

const { resource: allFieldsResource } = medicationDispenseEntryWithAllFields;

const mandatoryBase = {
  status: 'completed' as const,
  medicationCodeableConcept:
    minimalMedicationDispenseEntry.resource?.medicationCodeableConcept,
};

describe('createMedicationDispenseBundleEntry', () => {
  it.each([
    ['medicationCodeableConcept', minimalMedicationDispenseEntry],
    ['medicationReference', minimalMedicationDispenseEntryWithReference],
  ])(
    'returns a valid BundleEntry with mandatory fields using %s',
    (_, expected) => {
      const { resource } = expected;
      const { resourceType, ...mandatoryFields } = resource;

      expect(
        createMedicationDispenseBundleEntry(
          mandatoryFields as Parameters<
            typeof createMedicationDispenseBundleEntry
          >[0],
        ),
      ).toEqual(expected);
    },
  );

  it('places fullUrl on the BundleEntry wrapper, not the resource', () => {
    const fullUrl = 'urn:uuid:dispense-uuid-456';

    const result = createMedicationDispenseBundleEntry({
      ...mandatoryBase,
      fullUrl,
    });

    expect(result.fullUrl).toBe(fullUrl);
    expect(result.resource?.['fullUrl']).toBeUndefined();
  });

  it('omits fullUrl from the BundleEntry when not provided', () => {
    const result = createMedicationDispenseBundleEntry(mandatoryBase);

    expect(result).not.toHaveProperty('fullUrl');
  });

  it.each([
    ['id', { id: 'dispense-uuid-456' }],
    ['meta', { meta: { versionId: '1' } }],
    ['identifier', { identifier: allFieldsResource.identifier }],
    ['partOf', { partOf: allFieldsResource.partOf }],
    [
      'statusReasonCodeableConcept',
      {
        statusReasonCodeableConcept:
          allFieldsResource.statusReasonCodeableConcept,
      },
    ],
    ['category', { category: allFieldsResource.category }],
    ['subject', { subject: { reference: 'Patient/patient-uuid-123' } }],
    ['context', { context: { reference: 'Encounter/encounter-uuid-123' } }],
    [
      'supportingInformation',
      { supportingInformation: allFieldsResource.supportingInformation },
    ],
    ['performer', { performer: allFieldsResource.performer }],
    ['location', { location: { reference: 'Location/location-uuid-123' } }],
    [
      'authorizingPrescription',
      { authorizingPrescription: allFieldsResource.authorizingPrescription },
    ],
    ['type', { type: allFieldsResource.type }],
    ['quantity', { quantity: { value: 30, unit: 'tablet' } }],
    ['daysSupply', { daysSupply: { value: 30, unit: 'days' } }],
    ['whenPrepared', { whenPrepared: '2024-01-15T10:00:00Z' }],
    ['whenHandedOver', { whenHandedOver: '2024-01-15T10:30:00Z' }],
    [
      'destination',
      { destination: { reference: 'Location/pharmacy-uuid-123' } },
    ],
    ['receiver', { receiver: allFieldsResource.receiver }],
    ['note', { note: [{ text: 'Take with food' }] }],
    [
      'dosageInstruction',
      { dosageInstruction: allFieldsResource.dosageInstruction },
    ],
    ['substitution', { substitution: allFieldsResource.substitution }],
    ['detectedIssue', { detectedIssue: allFieldsResource.detectedIssue }],
    ['eventHistory', { eventHistory: allFieldsResource.eventHistory }],
  ])('places %s on the resource', (_, optionalFields) => {
    const result = createMedicationDispenseBundleEntry({
      ...mandatoryBase,
      ...optionalFields,
    });

    expect(result.resource).toMatchObject({
      resourceType: 'MedicationDispense',
      ...mandatoryBase,
      ...optionalFields,
    });
  });

  it('builds a complete entry with all fields', () => {
    const { fullUrl, resource } = medicationDispenseEntryWithAllFields;
    const { resourceType, ...dispenseFields } = resource;

    const result = createMedicationDispenseBundleEntry({
      fullUrl,
      ...dispenseFields,
    } as Parameters<typeof createMedicationDispenseBundleEntry>[0]);

    expect(result).toEqual(medicationDispenseEntryWithAllFields);
  });
});
