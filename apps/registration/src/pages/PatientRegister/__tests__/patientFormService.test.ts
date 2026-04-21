import { validateAllSections, collectFormData } from '../patientFormService';
import type { PatientFormRefs } from '../patientFormService';

describe('patientFormService', () => {
  let mockAddNotification: jest.Mock;
  let mockT: jest.Mock;

  beforeEach(() => {
    mockAddNotification = jest.fn();
    mockT = jest.fn((key: string) => key);
    jest.clearAllMocks();
  });

  describe('validateAllSections', () => {
    it('should return true when all sections are valid', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalIdentifiersRef: {
          current: null,
        },
      };

      const result = validateAllSections(mockRefs, mockAddNotification, mockT);

      expect(result).toBe(true);
      expect(mockRefs.profileRef.current?.validate).toHaveBeenCalled();
      expect(mockRefs.addressRef.current?.validate).toHaveBeenCalled();
      expect(mockRefs.contactRef.current?.validate).toHaveBeenCalled();
      expect(mockRefs.additionalRef.current?.validate).toHaveBeenCalled();
      expect(mockAddNotification).not.toHaveBeenCalled();
    });

    it('should return false when profile validation fails', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(() => false),
            getData: jest.fn(),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalIdentifiersRef: {
          current: null,
        },
      };

      const result = validateAllSections(mockRefs, mockAddNotification, mockT);

      expect(result).toBe(false);
      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'NOTIFICATION_ERROR_TITLE',
        message: 'NOTIFICATION_VALIDATION_ERRORS',
        type: 'error',
        timeout: 5000,
      });
    });

    it('should return false when address validation fails', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(() => false),
            getData: jest.fn(),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalIdentifiersRef: {
          current: null,
        },
      };

      const result = validateAllSections(mockRefs, mockAddNotification, mockT);

      expect(result).toBe(false);
      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'NOTIFICATION_ERROR_TITLE',
        message: 'NOTIFICATION_VALIDATION_ERRORS',
        type: 'error',
        timeout: 5000,
      });
    });

    it('should return false when contact validation fails', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(() => false),
            getData: jest.fn(),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalIdentifiersRef: {
          current: null,
        },
      };

      const result = validateAllSections(mockRefs, mockAddNotification, mockT);

      expect(result).toBe(false);
      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'NOTIFICATION_ERROR_TITLE',
        message: 'NOTIFICATION_VALIDATION_ERRORS',
        type: 'error',
        timeout: 5000,
      });
    });

    it('should return false when additional validation fails', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(() => false),
            getData: jest.fn(),
          },
        },
        additionalIdentifiersRef: {
          current: null,
        },
      };

      const result = validateAllSections(mockRefs, mockAddNotification, mockT);

      expect(result).toBe(false);
      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'NOTIFICATION_ERROR_TITLE',
        message: 'NOTIFICATION_VALIDATION_ERRORS',
        type: 'error',
        timeout: 5000,
      });
    });

    it('should return false when multiple sections fail validation', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(() => false),
            getData: jest.fn(),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(() => false),
            getData: jest.fn(),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalIdentifiersRef: {
          current: null,
        },
      };

      const result = validateAllSections(mockRefs, mockAddNotification, mockT);

      expect(result).toBe(false);
      expect(mockAddNotification).toHaveBeenCalledTimes(1);
    });

    it('should return false when profileRef.current is null', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: null,
        },
        addressRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalIdentifiersRef: {
          current: null,
        },
      };

      const result = validateAllSections(mockRefs, mockAddNotification, mockT);

      expect(result).toBe(false);
      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'NOTIFICATION_ERROR_TITLE',
        message: 'NOTIFICATION_VALIDATION_ERRORS',
        type: 'error',
        timeout: 5000,
      });
    });

    it('should return true when addressRef.current is null (section not rendered)', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: { current: null },
        contactRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalIdentifiersRef: { current: null },
      };

      const result = validateAllSections(mockRefs, mockAddNotification, mockT);

      expect(result).toBe(true);
      expect(mockAddNotification).not.toHaveBeenCalled();
    });

    it('should return true when contactRef.current is null (section not rendered)', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        contactRef: { current: null },
        additionalRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalIdentifiersRef: { current: null },
      };

      const result = validateAllSections(mockRefs, mockAddNotification, mockT);

      expect(result).toBe(true);
      expect(mockAddNotification).not.toHaveBeenCalled();
    });

    it('should return true when additionalRef.current is null (section not rendered)', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalRef: { current: null },
        additionalIdentifiersRef: { current: null },
      };

      const result = validateAllSections(mockRefs, mockAddNotification, mockT);

      expect(result).toBe(true);
      expect(mockAddNotification).not.toHaveBeenCalled();
    });

    it('should return true when all optional section refs are null (only profile rendered)', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: { current: null },
        contactRef: { current: null },
        additionalRef: { current: null },
        additionalIdentifiersRef: { current: null },
      };

      const result = validateAllSections(mockRefs, mockAddNotification, mockT);

      expect(result).toBe(true);
      expect(mockAddNotification).not.toHaveBeenCalled();
    });

    it('should validate all sections even if first one fails', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(() => false),
            getData: jest.fn(),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalIdentifiersRef: {
          current: null,
        },
      };

      validateAllSections(mockRefs, mockAddNotification, mockT);

      // Verify all validate methods were called even though first one failed
      expect(mockRefs.profileRef.current?.validate).toHaveBeenCalled();
      expect(mockRefs.addressRef.current?.validate).toHaveBeenCalled();
      expect(mockRefs.contactRef.current?.validate).toHaveBeenCalled();
      expect(mockRefs.additionalRef.current?.validate).toHaveBeenCalled();
    });

    it('should skip additional identifiers validation when section is not visible', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalIdentifiersRef: {
          current: {
            validate: jest.fn(() => false), // This would fail if called
            getData: jest.fn(),
          },
        },
      };

      // Pass shouldValidateAdditionalIdentifiers: false
      const result = validateAllSections(mockRefs, mockAddNotification, mockT, {
        shouldValidateAdditionalIdentifiers: false,
      });

      // Should return true because additional identifiers validation is skipped
      expect(result).toBe(true);
      expect(
        mockRefs.additionalIdentifiersRef.current?.validate,
      ).not.toHaveBeenCalled();
      expect(mockAddNotification).not.toHaveBeenCalled();
    });

    it('should validate additional identifiers when section is visible', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalIdentifiersRef: {
          current: {
            validate: jest.fn(() => false),
            getData: jest.fn(),
          },
        },
      };

      // Pass shouldValidateAdditionalIdentifiers: true
      const result = validateAllSections(mockRefs, mockAddNotification, mockT, {
        shouldValidateAdditionalIdentifiers: true,
      });

      // Should return false because additional identifiers validation failed
      expect(result).toBe(false);
      expect(
        mockRefs.additionalIdentifiersRef.current?.validate,
      ).toHaveBeenCalled();
      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'NOTIFICATION_ERROR_TITLE',
        message: 'NOTIFICATION_VALIDATION_ERRORS',
        type: 'error',
        timeout: 5000,
      });
    });
  });

  describe('collectFormData', () => {
    it('should collect data from all sections successfully', () => {
      const mockProfileData = {
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
        dateOfBirth: '1990-01-01',
        dobEstimated: false,
        patientIdentifier: {
          identifierPrefix: 'BDH',
          identifierType: 'Primary',
          preferred: true,
          voided: false,
        },
      };

      const mockAddressData = {
        address1: '123 Main St',
        cityVillage: 'New York',
      };

      const mockContactData = {
        phoneNumber: '1234567890',
      };

      const mockAdditionalData = {
        email: 'john@example.com',
      };

      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => mockProfileData) as any,
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => mockAddressData) as any,
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => mockContactData) as any,
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => mockAdditionalData) as any,
          },
        },
        additionalIdentifiersRef: {
          current: null,
        },
      };

      const result = collectFormData(mockRefs, mockAddNotification, mockT);

      expect(result).toEqual({
        profile: mockProfileData,
        address: mockAddressData,
        contact: mockContactData,
        additional: mockAdditionalData,
        relationships: [],
        additionalIdentifiers: {},
      });
      expect(mockAddNotification).not.toHaveBeenCalled();
    });

    it('should return null when profile data is missing', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => null) as any,
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ address1: '123 Main St' })) as any,
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({
              phoneNumber: '1234567890',
              altPhoneNumber: '',
            })) as any,
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ email: 'test@example.com' })) as any,
          },
        },
        additionalIdentifiersRef: {
          current: null,
        },
      };

      const result = collectFormData(mockRefs, mockAddNotification, mockT);

      expect(result).toBeNull();
      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'NOTIFICATION_ERROR_TITLE',
        message: 'NOTIFICATION_UNABLE_TO_GET_PATIENT_DATA',
        type: 'error',
        timeout: 5000,
      });
    });

    it('should return null when profileRef.current is null', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: null,
        },
        addressRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ address1: '123 Main St' })) as any,
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ phoneNumber: '1234567890' })) as any,
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ email: 'test@example.com' })) as any,
          },
        },
        additionalIdentifiersRef: {
          current: null,
        },
      };

      const result = collectFormData(mockRefs, mockAddNotification, mockT);

      expect(result).toBeNull();
      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'NOTIFICATION_ERROR_TITLE',
        message: 'NOTIFICATION_UNABLE_TO_GET_PATIENT_DATA',
        type: 'error',
        timeout: 5000,
      });
    });

    it('should use empty object for address when addressRef.current is null (section not rendered)', () => {
      const mockProfileData = {
        firstName: 'John',
        dobEstimated: false,
        patientIdentifier: {
          identifierPrefix: 'BDH',
          identifierType: 'Primary',
          preferred: true,
          voided: false,
        },
      };

      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => mockProfileData) as any,
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: { current: null },
        contactRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ phoneNumber: '1234567890' })) as any,
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({})) as any,
          },
        },
        additionalIdentifiersRef: { current: null },
      };

      const result = collectFormData(mockRefs, mockAddNotification, mockT);

      expect(result).not.toBeNull();
      expect(result?.address).toEqual({});
      expect(mockAddNotification).not.toHaveBeenCalled();
    });

    it('should use empty object for contact when contactRef.current is null (section not rendered)', () => {
      const mockProfileData = {
        firstName: 'John',
        dobEstimated: false,
        patientIdentifier: {
          identifierPrefix: 'BDH',
          identifierType: 'Primary',
          preferred: true,
          voided: false,
        },
      };

      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => mockProfileData) as any,
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ address1: '123 Main St' })) as any,
          },
        },
        contactRef: { current: null },
        additionalRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({})) as any,
          },
        },
        additionalIdentifiersRef: { current: null },
      };

      const result = collectFormData(mockRefs, mockAddNotification, mockT);

      expect(result).not.toBeNull();
      expect(result?.contact).toEqual({});
      expect(mockAddNotification).not.toHaveBeenCalled();
    });

    it('should use empty object for additional when additionalRef.current is null (section not rendered)', () => {
      const mockProfileData = {
        firstName: 'John',
        dobEstimated: false,
        patientIdentifier: {
          identifierPrefix: 'BDH',
          identifierType: 'Primary',
          preferred: true,
          voided: false,
        },
      };

      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => mockProfileData) as any,
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ address1: '123 Main St' })) as any,
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ phoneNumber: '1234567890' })) as any,
          },
        },
        additionalRef: { current: null },
        additionalIdentifiersRef: { current: null },
      };

      const result = collectFormData(mockRefs, mockAddNotification, mockT);

      expect(result).not.toBeNull();
      expect(result?.additional).toEqual({});
      expect(mockAddNotification).not.toHaveBeenCalled();
    });

    it('should succeed with empty data when all optional section refs are null (only profile rendered)', () => {
      const mockProfileData = {
        firstName: 'John',
        dobEstimated: false,
        patientIdentifier: {
          identifierPrefix: 'BDH',
          identifierType: 'Primary',
          preferred: true,
          voided: false,
        },
      };

      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => mockProfileData) as any,
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: { current: null },
        contactRef: { current: null },
        additionalRef: { current: null },
        additionalIdentifiersRef: { current: null },
      };

      const result = collectFormData(mockRefs, mockAddNotification, mockT);

      expect(result).toEqual({
        profile: mockProfileData,
        address: {},
        contact: {},
        additional: {},
        relationships: [],
        additionalIdentifiers: {},
      });
      expect(mockAddNotification).not.toHaveBeenCalled();
    });

    it('should handle undefined getData return value for profile', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => undefined) as any,
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ address1: '123 Main St' })) as any,
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ phoneNumber: '1234567890' })) as any,
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ email: 'test@example.com' })) as any,
          },
        },
        additionalIdentifiersRef: {
          current: null,
        },
      };

      const result = collectFormData(mockRefs, mockAddNotification, mockT);

      expect(result).toBeNull();
      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'NOTIFICATION_ERROR_TITLE',
        message: 'NOTIFICATION_UNABLE_TO_GET_PATIENT_DATA',
        type: 'error',
        timeout: 5000,
      });
    });
  });
});
