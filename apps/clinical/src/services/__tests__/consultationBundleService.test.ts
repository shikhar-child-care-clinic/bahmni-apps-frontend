import { DiagnosisInputEntry, post, Form2Observation } from '@bahmni/services';
import { Reference, Coding, Observation } from 'fhir/r4';
import { CONSULTATION_ERROR_MESSAGES } from '../../constants/errors';
import { AllergyInputEntry } from '../../models/allergy';
import { ConditionInputEntry } from '../../models/condition';
import { FhirEncounter } from '../../models/encounter';
import { ImmunizationInputEntry } from '../../models/immunization';
import { MedicationInputEntry } from '../../models/medication';
import { ServiceRequestInputEntry } from '../../models/serviceRequest';
import {
  createDiagnosisBundleEntries,
  createAllergiesBundleEntries,
  createServiceRequestBundleEntries,
  createConditionsBundleEntries,
  createMedicationRequestEntries,
  postConsultationBundle,
  createEncounterBundleEntry,
  getEncounterReference,
  createObservationBundleEntries,
  createImmunizationBundleEntries,
} from '../consultationBundleService';

// Mock crypto.randomUUID
const mockUUID = '1d87ab20-8b86-4b41-a30d-984b2208d945';
global.crypto.randomUUID = jest.fn().mockReturnValue(mockUUID);
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  post: jest.fn(),
}));
jest.mock('@bahmni/form2-controls', () => ({
  getFhirObservations: jest.fn().mockImplementation((observations: any[]) => {
    let idCounter = 0;

    const processObservations = (obs: any[]): any[] => {
      const localResults: any[] = [];

      obs.forEach((o) => {
        const currentId = `mock-id-${idCounter++}`;
        const currentFullUrl = `urn:uuid:${currentId}`;

        if (o.groupMembers && o.groupMembers.length > 0) {
          const memberResults = processObservations(o.groupMembers);
          localResults.push(...memberResults);

          const parentObservation: Observation = {
            resourceType: 'Observation',
            id: currentId,
            status: 'final',
            code: { coding: [{ code: o.concept?.uuid }] },
            hasMember: memberResults.map((m) => ({
              reference: m.fullUrl,
              type: 'Observation',
            })) as any[],
          };

          localResults.push({
            resource: parentObservation,
            fullUrl: currentFullUrl,
          });
        } else {
          const childObservation: Observation = {
            resourceType: 'Observation',
            id: currentId,
            status: 'final',
            code: { coding: [{ code: o.concept?.uuid }] },
          };

          localResults.push({
            resource: childObservation,
            fullUrl: currentFullUrl,
          });
        }
      });

      return localResults;
    };

    return processObservations(observations);
  }),
}));

describe('consultationBundleService', () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  const mockEncounterSubject: Reference = {
    reference: 'Patient/123',
  };

  const mockEncounterReference = 'urn:uuid:12345';
  const mockPractitionerUUID = 'd7a669e7-5e07-11ef-8f7c-0242ac120002';

  // Registers 3 it() cases for the common encounterSubject/encounterReference/practitionerUUID
  // validations that every bundle entry creator shares.
  function testCommonBundleValidation(
    callFn: (overrides: Record<string, unknown>) => void,
  ) {
    it('should throw error when encounterSubject is null', () => {
      expect(() => callFn({ encounterSubject: null })).toThrow(
        CONSULTATION_ERROR_MESSAGES.INVALID_ENCOUNTER_SUBJECT,
      );
    });

    it('should throw error when encounterReference is empty', () => {
      expect(() => callFn({ encounterReference: '' })).toThrow(
        CONSULTATION_ERROR_MESSAGES.INVALID_ENCOUNTER_REFERENCE,
      );
    });

    it('should throw error when practitionerUUID is empty', () => {
      expect(() => callFn({ practitionerUUID: '' })).toThrow(
        CONSULTATION_ERROR_MESSAGES.INVALID_PRACTITIONER,
      );
    });
  }

  describe('createDiagnosisBundleEntries', () => {
    const mockDiagnosisEncounterReference = 'Encounter/456';
    const mockDiagnosisPractitionerUUID = 'practitioner-789';

    const mockDiagnosis: DiagnosisInputEntry = {
      id: 'diagnosis-123',
      display: 'Test Diagnosis',
      selectedCertainty: {
        code: 'confirmed',
        system: 'test-system',
        display: 'Confirmed',
      } as Coding,
      errors: {},
      hasBeenValidated: false,
    };

    it('should create bundle entries for valid diagnoses', () => {
      const result = createDiagnosisBundleEntries({
        selectedDiagnoses: [mockDiagnosis],
        encounterSubject: mockEncounterSubject,
        encounterReference: mockDiagnosisEncounterReference,
        practitionerUUID: mockDiagnosisPractitionerUUID,
        consultationDate: new Date(),
      });

      expect(result).toHaveLength(1);
      expect(result[0].request?.method).toBe('POST');
      expect(result[0].resource?.resourceType).toBe('Condition');
    });

    it('should handle empty diagnoses array', () => {
      const result = createDiagnosisBundleEntries({
        selectedDiagnoses: [],
        encounterSubject: mockEncounterSubject,
        encounterReference: mockDiagnosisEncounterReference,
        practitionerUUID: mockDiagnosisPractitionerUUID,
        consultationDate: new Date(),
      });

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });

    it('should throw error when selectedDiagnoses is null', () => {
      expect(() =>
        createDiagnosisBundleEntries({
          selectedDiagnoses: null as any,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockDiagnosisEncounterReference,
          practitionerUUID: mockDiagnosisPractitionerUUID,
          consultationDate: new Date(),
        }),
      ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_DIAGNOSIS_PARAMS);
    });

    testCommonBundleValidation((overrides) =>
      createDiagnosisBundleEntries({
        selectedDiagnoses: [mockDiagnosis],
        encounterSubject: mockEncounterSubject,
        encounterReference: mockDiagnosisEncounterReference,
        practitionerUUID: mockDiagnosisPractitionerUUID,
        consultationDate: new Date(),
        ...(overrides as any),
      }),
    );

    it('should throw error for diagnoses without certainty code', () => {
      const diagnosisWithoutCertainty: DiagnosisInputEntry = {
        ...mockDiagnosis,
        selectedCertainty: null,
      };

      const diagnosisWithUndefinedCode: DiagnosisInputEntry = {
        ...mockDiagnosis,
        selectedCertainty: {
          system: 'test-system',
          display: 'Test',
          code: undefined,
        } as Coding,
      };
      expect(() =>
        createDiagnosisBundleEntries({
          selectedDiagnoses: [
            diagnosisWithoutCertainty,
            diagnosisWithUndefinedCode,
          ],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockDiagnosisEncounterReference,
          practitionerUUID: mockDiagnosisPractitionerUUID,
          consultationDate: new Date(),
        }),
      ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_DIAGNOSIS_PARAMS);
    });
  });

  describe('postConsultationBundle', () => {
    it('should call post with the correct URL and payload', async () => {
      const mockBundle = { resourceType: 'ConsultationBundle' } as any;
      const mockResponse = { status: 'success' };

      (post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await postConsultationBundle(mockBundle);

      expect(post).toHaveBeenCalledWith(
        `/openmrs/ws/fhir2/R4/ConsultationBundle`,
        mockBundle,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createAllergiesBundleEntries', () => {
    const mockValidAllergy: AllergyInputEntry = {
      id: '162536AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      display: 'Penicillin',
      type: 'medication',
      selectedSeverity: {
        code: 'moderate',
        display: 'Moderate',
      },
      selectedReactions: [
        {
          code: '121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'Rash',
        },
        {
          code: '117399AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'Nausea',
        },
      ],
      errors: {},
      hasBeenValidated: true,
    };

    describe('Happy Paths', () => {
      it('should create bundle entries for valid allergies with all required fields', () => {
        const result = createAllergiesBundleEntries({
          selectedAllergies: [mockValidAllergy],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(1);
        expect(result[0].resource?.resourceType).toBe('AllergyIntolerance');
        expect(result[0].request?.method).toBe('POST');
        expect(result[0].request?.url).toBe('AllergyIntolerance');
      });

      it('should handle multiple allergies correctly', () => {
        const secondAllergy = {
          ...mockValidAllergy,
          id: '162537AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'Aspirin',
        };

        const result = createAllergiesBundleEntries({
          selectedAllergies: [mockValidAllergy, secondAllergy],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(2);
      });
    });

    describe('Sad Paths', () => {
      it('should throw error for invalid allergy params', () => {
        expect(() =>
          createAllergiesBundleEntries({
            selectedAllergies: null as any,
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_ALLERGY_PARAMS);
      });

      testCommonBundleValidation((overrides) =>
        createAllergiesBundleEntries({
          selectedAllergies: [mockValidAllergy],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
          ...(overrides as any),
        }),
      );

      it('should throw error for allergy without severity', () => {
        const allergyWithoutSeverity = {
          ...mockValidAllergy,
          selectedSeverity: null,
        };

        expect(() =>
          createAllergiesBundleEntries({
            selectedAllergies: [allergyWithoutSeverity],
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_ALLERGY_PARAMS);
      });

      it('should throw error for allergy without reactions', () => {
        const allergyWithoutReactions = {
          ...mockValidAllergy,
          selectedReactions: [],
        };

        expect(() =>
          createAllergiesBundleEntries({
            selectedAllergies: [allergyWithoutReactions],
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_ALLERGY_PARAMS);
      });
    });

    describe('Edge Cases', () => {
      it('should return empty array for empty allergies list', () => {
        const result = createAllergiesBundleEntries({
          selectedAllergies: [],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toEqual([]);
      });
    });

    describe('createEncounterBundleEntry', () => {
      const mockEncounterResource = {
        resourceType: 'Encounter',
        status: 'in-progress',
        subject: { reference: 'Patient/123' },
      };

      describe('Happy Path', () => {
        it('should create POST bundle entry for new encounter when no active encounter exists', () => {
          const result = createEncounterBundleEntry(
            null,
            mockEncounterResource,
          );

          expect(result.fullUrl).toMatch(/^urn:uuid:/);
          expect(result.resource).toBe(mockEncounterResource);
          expect(result.request?.method).toBe('POST');
          expect(result.request?.url).toBe('Encounter');
        });

        it('should create PUT bundle entry for existing encounter when active encounter exists', () => {
          const activeEncounter: FhirEncounter = {
            resourceType: 'Encounter',
            id: 'encounter-123',
            status: 'in-progress',
            subject: { reference: 'Patient/123' },
          };

          const result = createEncounterBundleEntry(
            activeEncounter,
            mockEncounterResource,
          );

          expect(result.fullUrl).toBe('Encounter/encounter-123');
          expect(result.resource).toEqual({
            ...mockEncounterResource,
            id: 'encounter-123',
          });
          expect(result.request?.method).toBe('PUT');
          expect(result.request?.url).toBe('Encounter/encounter-123');
        });
      });

      describe('Edge Cases', () => {
        it('should handle active encounter without id gracefully', () => {
          const activeEncounterWithoutId = {
            resourceType: 'Encounter' as const,
            status: 'in-progress' as const,
            subject: { reference: 'Patient/123' },
          };

          const result = createEncounterBundleEntry(
            activeEncounterWithoutId,
            mockEncounterResource,
          );

          expect(result.fullUrl).toBe('Encounter/undefined');
          expect(result.resource).toEqual({
            ...mockEncounterResource,
            id: undefined,
          });
          expect(result.request?.method).toBe('PUT');
          expect(result.request?.url).toBe('Encounter/undefined');
        });

        it('should handle empty encounter resource', () => {
          const emptyResource = {};
          const result = createEncounterBundleEntry(null, emptyResource);

          expect(result.fullUrl).toMatch(/^urn:uuid:/);
          expect(result.resource).toBe(emptyResource);
          expect(result.request?.method).toBe('POST');
          expect(result.request?.url).toBe('Encounter');
        });
      });
    });

    describe('getEncounterReference', () => {
      describe('Happy Path', () => {
        it('should return encounter reference for active encounter', () => {
          const activeEncounter: FhirEncounter = {
            resourceType: 'Encounter',
            id: 'encounter-123',
            status: 'in-progress',
            subject: {
              reference: 'Patient/123',
              type: '',
              display: '',
            },
            meta: {
              versionId: '',
              lastUpdated: '',
              tag: [],
            },
            class: {
              system: '',
              code: '',
            },
            type: [],
            period: undefined,
            location: [],
          };

          const result = getEncounterReference(
            activeEncounter,
            'placeholder-ref',
          );

          expect(result).toBe('Encounter/encounter-123');
        });

        it('should return placeholder reference when no active encounter', () => {
          const placeholderRef = 'urn:uuid:placeholder-123';

          const result = getEncounterReference(null, placeholderRef);

          expect(result).toBe(placeholderRef);
        });
      });

      describe('Edge Cases', () => {
        it('should handle active encounter without id', () => {
          const activeEncounterWithoutId = {
            resourceType: 'Encounter' as const,
            status: 'in-progress' as const,
            subject: { reference: 'Patient/123' },
          };

          const result = getEncounterReference(
            activeEncounterWithoutId,
            'placeholder-ref',
          );

          expect(result).toBe('Encounter/undefined');
        });

        it('should handle empty placeholder reference', () => {
          const result = getEncounterReference(null, '');

          expect(result).toBe('');
        });

        it('should handle null active encounter', () => {
          const result = getEncounterReference(null, 'urn:uuid:test-123');

          expect(result).toBe('urn:uuid:test-123');
        });
      });
    });
  });

  describe('createServiceRequestBundleEntries', () => {
    const mockServiceRequest: ServiceRequestInputEntry = {
      id: 'service-request-123',
      display: 'Blood Test',
      selectedPriority: 'routine',
    };

    const mockStatServiceRequest: ServiceRequestInputEntry = {
      id: 'service-request-456',
      display: 'Emergency CT Scan',
      selectedPriority: 'stat',
    };

    describe('Happy Paths', () => {
      it('should create bundle entries for valid service requests', () => {
        const serviceRequestsMap = new Map<
          string,
          ServiceRequestInputEntry[]
        >();
        serviceRequestsMap.set('lab', [mockServiceRequest]);

        const result = createServiceRequestBundleEntries({
          selectedServiceRequests: serviceRequestsMap,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(1);
        expect(result[0].resource?.resourceType).toBe('ServiceRequest');
        expect(result[0].request?.method).toBe('POST');
        expect(result[0].fullUrl).toBe(`urn:uuid:${mockUUID}`);
      });

      it('should handle multiple service requests in the same category', () => {
        const serviceRequestsMap = new Map<
          string,
          ServiceRequestInputEntry[]
        >();
        serviceRequestsMap.set('lab', [
          mockServiceRequest,
          mockStatServiceRequest,
        ]);

        const result = createServiceRequestBundleEntries({
          selectedServiceRequests: serviceRequestsMap,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(2);
      });

      it('should handle multiple categories with multiple service requests', () => {
        const serviceRequestsMap = new Map<
          string,
          ServiceRequestInputEntry[]
        >();
        serviceRequestsMap.set('lab', [mockServiceRequest]);
        serviceRequestsMap.set('radiology', [mockStatServiceRequest]);

        const result = createServiceRequestBundleEntries({
          selectedServiceRequests: serviceRequestsMap,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(2);
      });
    });

    describe('Sad Paths - Validation Errors', () => {
      const serviceRequestsMap = new Map<string, ServiceRequestInputEntry[]>();
      serviceRequestsMap.set('lab', [mockServiceRequest]);

      testCommonBundleValidation((overrides) =>
        createServiceRequestBundleEntries({
          selectedServiceRequests: serviceRequestsMap,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
          ...(overrides as any),
        }),
      );
    });

    describe('Edge Cases', () => {
      it('should return empty array for empty Map', () => {
        const emptyMap = new Map<string, ServiceRequestInputEntry[]>();

        const result = createServiceRequestBundleEntries({
          selectedServiceRequests: emptyMap,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toEqual([]);
      });

      it('should skip categories with empty arrays', () => {
        const serviceRequestsMap = new Map<
          string,
          ServiceRequestInputEntry[]
        >();
        serviceRequestsMap.set('lab', []);
        serviceRequestsMap.set('radiology', [mockServiceRequest]);

        const result = createServiceRequestBundleEntries({
          selectedServiceRequests: serviceRequestsMap,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(1);
      });

      it('should skip categories with null values', () => {
        const serviceRequestsMap = new Map<
          string,
          ServiceRequestInputEntry[]
        >();

        serviceRequestsMap.set('lab', null as any);
        serviceRequestsMap.set('radiology', [mockServiceRequest]);

        const result = createServiceRequestBundleEntries({
          selectedServiceRequests: serviceRequestsMap,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(1);
      });

      it('should handle Map with all empty/null categories', () => {
        const serviceRequestsMap = new Map<
          string,
          ServiceRequestInputEntry[]
        >();
        serviceRequestsMap.set('lab', []);

        serviceRequestsMap.set('radiology', null as any);
        serviceRequestsMap.set('other', []);

        const result = createServiceRequestBundleEntries({
          selectedServiceRequests: serviceRequestsMap,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toEqual([]);
      });
    });
  });

  describe('createConditionsBundleEntries', () => {
    const mockValidCondition: ConditionInputEntry = {
      id: '162539AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      display: 'Diabetes Mellitus',
      durationValue: 2,
      durationUnit: 'years',
      errors: {},
      hasBeenValidated: true,
    };

    describe('Happy Path Tests', () => {
      it('should create bundle entries for valid conditions', () => {
        const result = createConditionsBundleEntries({
          selectedConditions: [mockValidCondition],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
          consultationDate: new Date(),
        });

        expect(result).toHaveLength(1);
        expect(result[0].request?.method).toBe('POST');
        expect(result[0].resource?.resourceType).toBe('Condition');
      });

      it('should create one entry per condition', () => {
        const secondCondition: ConditionInputEntry = {
          id: '162540AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          display: 'Hypertension',
          durationValue: 6,
          durationUnit: 'months',
          errors: {},
          hasBeenValidated: true,
        };

        const result = createConditionsBundleEntries({
          selectedConditions: [mockValidCondition, secondCondition],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
          consultationDate: new Date(),
        });

        expect(result).toHaveLength(2);
      });
    });

    describe('Validation Tests (Sad Paths)', () => {
      it('should throw error for null/undefined selectedConditions', () => {
        expect(() =>
          createConditionsBundleEntries({
            selectedConditions: null as any,
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
            consultationDate: new Date(),
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_CONDITION_PARAMS);
      });

      testCommonBundleValidation((overrides) =>
        createConditionsBundleEntries({
          selectedConditions: [mockValidCondition],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
          consultationDate: new Date(),
          ...(overrides as any),
        }),
      );

      it('should throw error for conditions with invalid duration values', () => {
        const invalidCondition: ConditionInputEntry = {
          ...mockValidCondition,
          durationValue: null,
          durationUnit: 'days',
        };

        expect(() =>
          createConditionsBundleEntries({
            selectedConditions: [invalidCondition],
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
            consultationDate: new Date(),
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_CONDITION_PARAMS);
      });

      it('should throw error for conditions with invalid duration units', () => {
        const invalidCondition: ConditionInputEntry = {
          ...mockValidCondition,
          durationValue: 5,
          durationUnit: null,
        };

        expect(() =>
          createConditionsBundleEntries({
            selectedConditions: [invalidCondition],
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
            consultationDate: new Date(),
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_CONDITION_PARAMS);
      });
    });

    describe('Edge Cases', () => {
      it('should return empty array for empty conditions list', () => {
        const result = createConditionsBundleEntries({
          selectedConditions: [],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
          consultationDate: new Date(),
        });

        expect(result).toEqual([]);
      });
    });
  });

  describe('createMedicationRequestEntries', () => {
    const mockMedicationEntry: MedicationInputEntry = {
      id: 'med-123',
      medication: {
        resourceType: 'Medication',
        id: 'med-123',
      },
      display: 'Aspirin 100mg',
      dosage: 100,
      dosageUnit: null,
      frequency: null,
      instruction: null,
      route: null,
      duration: 7,
      durationUnit: null,
      isSTAT: false,
      isPRN: false,
      dispenseQuantity: 14,
      dispenseUnit: null,
      errors: {},
      hasBeenValidated: true,
    };

    describe('Bundle Entry Creation', () => {
      it('should create bundle entries with correct structure', () => {
        const result = createMedicationRequestEntries({
          selectedMedications: [mockMedicationEntry],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(1);
        expect(result[0].fullUrl).toBe(`urn:uuid:${mockUUID}`);
        expect(result[0].resource?.resourceType).toBe('MedicationRequest');
        expect(result[0].request).toEqual({
          method: 'POST',
          url: 'MedicationRequest',
        });
      });

      it('should create multiple bundle entries for multiple medications', () => {
        const medications = [
          mockMedicationEntry,
          { ...mockMedicationEntry, id: 'med-456' },
          { ...mockMedicationEntry, id: 'med-789' },
        ];

        const result = createMedicationRequestEntries({
          selectedMedications: medications,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(3);
        result.forEach((entry) => {
          expect(entry.resource?.resourceType).toBe('MedicationRequest');
          expect(entry.request?.method).toBe('POST');
        });
      });

      it('should return empty array for empty medications list', () => {
        const result = createMedicationRequestEntries({
          selectedMedications: [],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toEqual([]);
      });
    });

    describe('Parameter Validation', () => {
      it('should throw error for null selectedMedications', () => {
        expect(() =>
          createMedicationRequestEntries({
            selectedMedications: null as any,
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_CONDITION_PARAMS);
      });

      it('should throw error for non-array selectedMedications', () => {
        expect(() =>
          createMedicationRequestEntries({
            selectedMedications: 'not-an-array' as any,
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_CONDITION_PARAMS);
      });

      testCommonBundleValidation((overrides) =>
        createMedicationRequestEntries({
          selectedMedications: [mockMedicationEntry],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
          ...(overrides as any),
        }),
      );
    });

    describe('UUID Generation', () => {
      it('should generate unique UUIDs for each medication entry', () => {
        const medications = [
          mockMedicationEntry,
          { ...mockMedicationEntry, id: 'med-456' },
        ];

        // Mock different UUIDs for each call
        let callCount = 0;
        const uuids = ['uuid-1', 'uuid-2'];
        (global.crypto.randomUUID as jest.Mock).mockImplementation(
          () => uuids[callCount++],
        );

        const result = createMedicationRequestEntries({
          selectedMedications: medications,
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result[0].fullUrl).toBe('urn:uuid:uuid-1');
        expect(result[1].fullUrl).toBe('urn:uuid:uuid-2');

        // Reset mock
        (global.crypto.randomUUID as jest.Mock).mockReturnValue(mockUUID);
      });
    });
  });

  describe('createObservationBundleEntries', () => {
    const mockObservations: Form2Observation[] = [
      {
        concept: { uuid: 'concept-uuid-1', datatype: 'Numeric' },
        value: 72,
        obsDatetime: '2025-01-15T10:30:00Z',
        formNamespace: 'Bahmni',
        formFieldPath: 'Vitals.1/1-0',
      },
    ];

    it('should create observation bundle entries using FhirObservationTransformer', () => {
      const result = createObservationBundleEntries({
        observationFormsData: { 'form-uuid-1': mockObservations },
        encounterSubject: mockEncounterSubject,
        encounterReference: mockEncounterReference,
        practitionerUUID: mockPractitionerUUID,
      });

      expect(result).toHaveLength(1);
      expect(result[0].resource?.resourceType).toBe('Observation');
      expect(result[0].request?.method).toBe('POST');
      expect(result[0].fullUrl).toMatch(/^urn:uuid:/);
    });

    it('should handle observations with group members', () => {
      const groupedObservations: Form2Observation[] = [
        {
          concept: { uuid: 'group-uuid' },
          value: null,
          groupMembers: [
            {
              concept: { uuid: 'member-1-uuid', datatype: 'Numeric' },
              value: 100,
            },
            {
              concept: { uuid: 'member-2-uuid', datatype: 'Text' },
              value: 'test',
            },
          ],
        },
      ];

      const result = createObservationBundleEntries({
        observationFormsData: { 'form-uuid-1': groupedObservations },
        encounterSubject: mockEncounterSubject,
        encounterReference: mockEncounterReference,
        practitionerUUID: mockPractitionerUUID,
      });

      // 2 members + 1 parent = 3 entries
      expect(result).toHaveLength(3);
    });

    it('should handle empty observations array', () => {
      const result = createObservationBundleEntries({
        observationFormsData: { 'form-uuid-1': [] },
        encounterSubject: mockEncounterSubject,
        encounterReference: mockEncounterReference,
        practitionerUUID: mockPractitionerUUID,
      });

      expect(result).toHaveLength(0);
    });

    describe('Parameter Validation', () => {
      it('should throw error when observationFormsData is null', () => {
        expect(() =>
          createObservationBundleEntries({
            observationFormsData: null as any,
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_CONDITION_PARAMS);
      });

      testCommonBundleValidation((overrides) =>
        createObservationBundleEntries({
          observationFormsData: { 'form-uuid-1': mockObservations },
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
          ...(overrides as any),
        }),
      );
    });

    describe('Multiple Forms Handling', () => {
      it('should handle multiple forms with observations', () => {
        const obs2: Form2Observation[] = [
          {
            concept: { uuid: 'concept-uuid-2', datatype: 'Numeric' },
            value: 98.6,
          },
        ];

        const result = createObservationBundleEntries({
          observationFormsData: {
            'form-uuid-1': mockObservations,
            'form-uuid-2': obs2,
          },
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(2);
        expect(
          result.every((r) => r.resource?.resourceType === 'Observation'),
        ).toBe(true);
      });

      it('should skip null form data in multiple forms', () => {
        const result = createObservationBundleEntries({
          observationFormsData: {
            'form-uuid-1': mockObservations,
            'form-uuid-2': null as any,
            'form-uuid-3': mockObservations,
          },
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(2);
      });

      it('should create valid bundle structure for all entries', () => {
        const result = createObservationBundleEntries({
          observationFormsData: { 'form-uuid-1': mockObservations },
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        result.forEach((entry) => {
          expect(entry.fullUrl).toBeDefined();
          expect(entry.resource?.resourceType).toBe('Observation');
          expect(entry.request?.method).toBe('POST');
          expect(entry.request?.url).toBe('Observation');
        });
      });
    });
  });

  describe('createImmunizationBundleEntries', () => {
    const mockImmunizationEntry: ImmunizationInputEntry = {
      id: 'imm-concept-uuid-123',
      vaccineConceptUuid: 'vaccine-uuid-123',
      vaccineDisplay: 'COVID-19 Vaccine',
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
      hasBeenValidated: true,
    };

    describe('Happy Paths', () => {
      it('should create a bundle entry with correct structure for a valid immunization', () => {
        const result = createImmunizationBundleEntries({
          selectedImmunizations: [mockImmunizationEntry],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(1);
        expect(result[0].fullUrl).toBe(`urn:uuid:${mockUUID}`);
        expect(result[0].request).toEqual({
          method: 'POST',
          url: 'Immunization',
        });
        expect(result[0].resource?.resourceType).toBe('Immunization');
      });

      it('should create one bundle entry per immunization', () => {
        const secondEntry: ImmunizationInputEntry = {
          ...mockImmunizationEntry,
          vaccineConceptUuid: 'vaccine-uuid-456',
        };

        const result = createImmunizationBundleEntries({
          selectedImmunizations: [mockImmunizationEntry, secondEntry],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toHaveLength(2);
        result.forEach((entry) => {
          expect(entry.resource?.resourceType).toBe('Immunization');
          expect(entry.request?.method).toBe('POST');
        });
      });

      it('should return empty array for empty immunizations list', () => {
        const result = createImmunizationBundleEntries({
          selectedImmunizations: [],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
        });

        expect(result).toEqual([]);
      });
    });

    describe('Sad Paths', () => {
      it('should throw error when selectedImmunizations is null', () => {
        expect(() =>
          createImmunizationBundleEntries({
            selectedImmunizations: null as any,
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_IMMUNIZATION_PARAMS);
      });

      it('should throw error when selectedImmunizations is not an array', () => {
        expect(() =>
          createImmunizationBundleEntries({
            selectedImmunizations: 'not-an-array' as any,
            encounterSubject: mockEncounterSubject,
            encounterReference: mockEncounterReference,
            practitionerUUID: mockPractitionerUUID,
          }),
        ).toThrow(CONSULTATION_ERROR_MESSAGES.INVALID_IMMUNIZATION_PARAMS);
      });

      testCommonBundleValidation((overrides) =>
        createImmunizationBundleEntries({
          selectedImmunizations: [mockImmunizationEntry],
          encounterSubject: mockEncounterSubject,
          encounterReference: mockEncounterReference,
          practitionerUUID: mockPractitionerUUID,
          ...(overrides as any),
        }),
      );
    });
  });
});
