import { Reference } from 'fhir/r4';
import { ImmunizationInputEntry } from '../../../models/immunization';
import { createImmunizationResource } from '../immunizationResourceCreator';

const FHIR_EXT_ADMINISTERED_PRODUCT =
  'http://fhir.bahmni.org/ext/immunization/administeredProduct';
const FHIR_EXT_BASED_ON = 'http://fhir.bahmni.org/ext/immunization/basedOn';

const mockSubjectReference: Reference = { reference: 'Patient/patient-uuid' };
const mockEncounterReference: Reference = {
  reference: 'Encounter/encounter-uuid',
};
const mockPractitionerReference: Reference = {
  reference: 'Practitioner/practitioner-uuid',
};

const baseEntry = (): ImmunizationInputEntry => ({
  id: 'entry-id',
  vaccineConceptUuid: 'vaccine-uuid',
  vaccineDisplay: 'BCG Vaccine',
  mode: 'administration',
  status: 'completed',
  drugUuid: null,
  drugDisplay: null,
  drugNonCoded: '',
  doseSequence: null,
  administeredOn: null,
  locationUuid: null,
  locationDisplay: null,
  locationText: '',
  routeConceptUuid: null,
  routeDisplay: null,
  siteConceptUuid: null,
  siteDisplay: null,
  manufacturer: '',
  batchNumber: '',
  expirationDate: null,
  notes: '',
  orderUuid: null,
  statusReasonConceptUuid: null,
  statusReasonDisplay: null,
  errors: {},
  hasBeenValidated: false,
});

describe('createImmunizationResource', () => {
  describe('required fields', () => {
    it('should create a resource with required fields set correctly', () => {
      const result = createImmunizationResource(
        baseEntry(),
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.resourceType).toBe('Immunization');
      expect(result.status).toBe('completed');
      expect(result.vaccineCode).toEqual({
        coding: [{ code: 'vaccine-uuid' }],
      });
      expect(result.patient).toBe(mockSubjectReference);
      expect(result.encounter).toBe(mockEncounterReference);
      expect(result.primarySource).toBe(true);
    });

    it('should set status to not-done and primarySource false for not-done mode', () => {
      const result = createImmunizationResource(
        { ...baseEntry(), mode: 'not-done', status: 'not-done' },
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.status).toBe('not-done');
      expect(result.primarySource).toBe(false);
    });

    it('should always include performer with administering provider', () => {
      const result = createImmunizationResource(
        baseEntry(),
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.performer).toHaveLength(1);
      expect(result.performer![0].function).toEqual({
        coding: [
          {
            code: 'AP',
            system: 'http://terminology.hl7.org/CodeSystem/v2-0443',
            display: 'Administering Provider',
          },
        ],
      });
      expect(result.performer![0].actor).toBe(mockPractitionerReference);
    });
  });

  describe('occurrenceDateTime', () => {
    it('should set occurrenceDateTime when administeredOn is provided', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      const result = createImmunizationResource(
        { ...baseEntry(), administeredOn: date },
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.occurrenceDateTime).toBe(date.toISOString());
    });

    it('should not set occurrenceDateTime when administeredOn is null', () => {
      const result = createImmunizationResource(
        { ...baseEntry(), administeredOn: null },
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.occurrenceDateTime).toBeUndefined();
    });
  });

  describe('statusReason', () => {
    it('should set statusReason when status is not-done and statusReasonConceptUuid is provided', () => {
      const result = createImmunizationResource(
        {
          ...baseEntry(),
          status: 'not-done',
          statusReasonConceptUuid: 'reason-uuid',
        },
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.statusReason).toEqual({
        coding: [{ code: 'reason-uuid' }],
      });
    });

    it('should not set statusReason when status is completed even with statusReasonConceptUuid', () => {
      const result = createImmunizationResource(
        {
          ...baseEntry(),
          status: 'completed',
          statusReasonConceptUuid: 'reason-uuid',
        },
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.statusReason).toBeUndefined();
    });
  });

  describe('location', () => {
    it('should set location with reference when locationUuid is provided', () => {
      const result = createImmunizationResource(
        { ...baseEntry(), locationUuid: 'loc-uuid' },
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.location).toEqual({ reference: 'Location/loc-uuid' });
    });

    it('should set location with display when locationText is provided and no uuid', () => {
      const result = createImmunizationResource(
        { ...baseEntry(), locationUuid: null, locationText: 'City Clinic' },
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.location).toEqual({ display: 'City Clinic' });
    });

    it('should prefer locationUuid over locationText', () => {
      const result = createImmunizationResource(
        {
          ...baseEntry(),
          locationUuid: 'loc-uuid',
          locationText: 'City Clinic',
        },
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.location).toEqual({ reference: 'Location/loc-uuid' });
    });

    it('should not set location when both locationUuid and locationText are empty', () => {
      const result = createImmunizationResource(
        { ...baseEntry(), locationUuid: null, locationText: '' },
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.location).toBeUndefined();
    });
  });

  describe('optional scalar fields', () => {
    it('should set manufacturer when provided', () => {
      const result = createImmunizationResource(
        { ...baseEntry(), manufacturer: 'Pfizer' },
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.manufacturer).toEqual({ display: 'Pfizer' });
    });

    it('should not set manufacturer when empty', () => {
      const result = createImmunizationResource(
        { ...baseEntry(), manufacturer: '' },
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.manufacturer).toBeUndefined();
    });

    it('should set lotNumber from batchNumber when provided', () => {
      const result = createImmunizationResource(
        { ...baseEntry(), batchNumber: 'BATCH-001' },
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.lotNumber).toBe('BATCH-001');
    });

    it('should not set lotNumber when batchNumber is empty', () => {
      const result = createImmunizationResource(
        { ...baseEntry(), batchNumber: '' },
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.lotNumber).toBeUndefined();
    });

    it('should set expirationDate as date-only string (YYYY-MM-DD)', () => {
      const date = new Date('2025-06-30T00:00:00.000Z');
      const result = createImmunizationResource(
        { ...baseEntry(), expirationDate: date },
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.expirationDate).toBe('2025-06-30');
    });

    it('should set route from routeConceptUuid', () => {
      const result = createImmunizationResource(
        { ...baseEntry(), routeConceptUuid: 'route-uuid' },
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.route).toEqual({ coding: [{ code: 'route-uuid' }] });
    });

    it('should set site from siteConceptUuid', () => {
      const result = createImmunizationResource(
        { ...baseEntry(), siteConceptUuid: 'site-uuid' },
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.site).toEqual({ coding: [{ code: 'site-uuid' }] });
    });

    it('should set protocolApplied with doseNumberPositiveInt', () => {
      const result = createImmunizationResource(
        { ...baseEntry(), doseSequence: 2 },
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.protocolApplied).toEqual([{ doseNumberPositiveInt: 2 }]);
    });

    it('should set note when notes are provided', () => {
      const result = createImmunizationResource(
        { ...baseEntry(), notes: 'Patient tolerated well' },
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.note).toEqual([{ text: 'Patient tolerated well' }]);
    });
  });

  describe('extensions', () => {
    it('should add administered product extension with reference when drugUuid is provided', () => {
      const result = createImmunizationResource(
        { ...baseEntry(), drugUuid: 'drug-uuid', drugDisplay: 'BCG Drug' },
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.extension).toContainEqual({
        url: FHIR_EXT_ADMINISTERED_PRODUCT,
        valueReference: { reference: 'Medication/drug-uuid' },
      });
    });

    it('should add administered product extension with display when only drugNonCoded is provided', () => {
      const result = createImmunizationResource(
        { ...baseEntry(), drugUuid: null, drugNonCoded: 'Generic Vaccine' },
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.extension).toContainEqual({
        url: FHIR_EXT_ADMINISTERED_PRODUCT,
        valueReference: { display: 'Generic Vaccine' },
      });
    });

    it('should add basedOn extension when orderUuid is provided', () => {
      const result = createImmunizationResource(
        { ...baseEntry(), orderUuid: 'order-uuid' },
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.extension).toContainEqual({
        url: FHIR_EXT_BASED_ON,
        valueReference: { reference: 'MedicationRequest/order-uuid' },
      });
    });

    it('should include both extensions when drugUuid and orderUuid are provided', () => {
      const result = createImmunizationResource(
        { ...baseEntry(), drugUuid: 'drug-uuid', orderUuid: 'order-uuid' },
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.extension).toHaveLength(2);
    });

    it('should not set extension when no drug or orderUuid is provided', () => {
      const result = createImmunizationResource(
        baseEntry(),
        mockSubjectReference,
        mockEncounterReference,
        mockPractitionerReference,
      );
      expect(result.extension).toBeUndefined();
    });
  });
});
