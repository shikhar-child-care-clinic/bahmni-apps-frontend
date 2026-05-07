import { BundleEntry, Medication } from 'fhir/r4';

export const minimalMedicationEntry: BundleEntry<Medication> = {
  resource: {
    resourceType: 'Medication',
  },
};

export const medicationEntryWithCode: BundleEntry<Medication> = {
  resource: {
    resourceType: 'Medication',
    code: {
      coding: [
        {
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          code: '1049502',
          display: 'Paracetamol 500mg',
        },
      ],
      text: 'Paracetamol 500mg',
    },
  },
};

export const medicationEntryWithAllFields: BundleEntry<Medication> = {
  fullUrl: 'urn:uuid:med-uuid-123',
  resource: {
    resourceType: 'Medication',
    id: 'med-uuid-123',
    meta: { versionId: '1' },
    identifier: [
      { system: 'http://example.org/medications', value: 'MED-001' },
    ],
    code: {
      coding: [
        {
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          code: '1049502',
          display: 'Paracetamol 500mg',
        },
      ],
      text: 'Paracetamol 500mg',
    },
    status: 'active',
    manufacturer: { reference: 'Organization/org-123' },
    form: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '385055001',
          display: 'Tablet',
        },
      ],
    },
    amount: {
      numerator: { value: 500, unit: 'mg' },
      denominator: { value: 1, unit: 'tablet' },
    },
    ingredient: [
      {
        itemCodeableConcept: {
          coding: [
            {
              system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
              code: '161',
              display: 'Acetaminophen',
            },
          ],
        },
        isActive: true,
        strength: {
          numerator: { value: 500, unit: 'mg' },
          denominator: { value: 1, unit: 'tablet' },
        },
      },
    ],
    batch: {
      lotNumber: 'LOT-2024-001',
      expirationDate: '2026-12-31',
    },
  },
};
