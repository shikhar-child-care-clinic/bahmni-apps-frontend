import { BundleEntry, MedicationDispense } from 'fhir/r4';

export const minimalMedicationDispenseEntry: BundleEntry<MedicationDispense> = {
  resource: {
    resourceType: 'MedicationDispense',
    status: 'completed',
    medicationCodeableConcept: {
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

export const minimalMedicationDispenseEntryWithReference: BundleEntry<MedicationDispense> =
  {
    resource: {
      resourceType: 'MedicationDispense',
      status: 'completed',
      medicationReference: { reference: 'Medication/med-uuid-123' },
    },
  };

export const medicationDispenseEntryWithAllFields: BundleEntry<MedicationDispense> =
  {
    fullUrl: 'urn:uuid:dispense-uuid-456',
    resource: {
      resourceType: 'MedicationDispense',
      id: 'dispense-uuid-456',
      meta: { versionId: '1' },
      status: 'completed',
      medicationCodeableConcept: {
        coding: [
          {
            system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
            code: '1049502',
            display: 'Paracetamol 500mg',
          },
        ],
        text: 'Paracetamol 500mg',
      },
      identifier: [
        { system: 'http://example.org/dispenses', value: 'DISP-001' },
      ],
      partOf: [{ reference: 'Procedure/proc-123' }],
      statusReasonCodeableConcept: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason',
            code: 'SALG',
            display: 'Allergy',
          },
        ],
      },
      category: {
        coding: [
          {
            system:
              'http://terminology.hl7.org/CodeSystem/medicationdispense-category',
            code: 'outpatient',
            display: 'Outpatient',
          },
        ],
      },
      subject: { reference: 'Patient/patient-uuid-123' },
      context: { reference: 'Encounter/encounter-uuid-123' },
      supportingInformation: [{ reference: 'Observation/obs-uuid-123' }],
      performer: [
        {
          actor: { reference: 'Practitioner/practitioner-uuid-123' },
        },
      ],
      location: { reference: 'Location/location-uuid-123' },
      authorizingPrescription: [{ reference: 'MedicationRequest/mr-uuid-123' }],
      type: {
        coding: [
          {
            system:
              'http://terminology.hl7.org/CodeSystem/v3-ActPharmacySupplyType',
            code: 'FF',
            display: 'First Fill',
          },
        ],
      },
      quantity: { value: 30, unit: 'tablet' },
      daysSupply: { value: 30, unit: 'days' },
      whenPrepared: '2024-01-15T10:00:00Z',
      whenHandedOver: '2024-01-15T10:30:00Z',
      destination: { reference: 'Location/pharmacy-uuid-123' },
      receiver: [{ reference: 'Patient/patient-uuid-123' }],
      note: [{ text: 'Take with food' }],
      dosageInstruction: [
        {
          text: '1 tablet twice daily',
          timing: { repeat: { frequency: 2, period: 1, periodUnit: 'd' } },
          doseAndRate: [{ doseQuantity: { value: 1, unit: 'tablet' } }],
        },
      ],
      substitution: {
        wasSubstituted: false,
        type: {
          coding: [
            {
              system:
                'http://terminology.hl7.org/CodeSystem/v3-substanceAdminSubstitution',
              code: 'N',
              display: 'None',
            },
          ],
        },
      },
      detectedIssue: [{ reference: 'DetectedIssue/issue-uuid-123' }],
      eventHistory: [{ reference: 'Provenance/prov-uuid-123' }],
    },
  };
