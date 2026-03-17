import {
  formSectionMap,
  getFormControlConfig,
  isValidFormControlType,
} from '../formSectionMap';
import { Profile } from '../../../components/forms/profile/Profile';
import { AddressInfo } from '../../../components/forms/addressInfo/AddressInfo';
import { ContactInfo } from '../../../components/forms/contactInfo/ContactInfo';
import { AdditionalInfo } from '../../../components/forms/additionalInfo/AdditionalInfo';
import { AdditionalIdentifiers } from '../../../components/forms/additionalIdentifiers/AdditionalIdentifiers';
import { PatientRelationships } from '../../../components/forms/patientRelationships/PatientRelationships';

describe('formSectionMap', () => {
  describe('formSectionMap object', () => {
    it('should have all 6 control types', () => {
      expect(Object.keys(formSectionMap)).toEqual([
        'profile',
        'address',
        'contactInfo',
        'additionalInfo',
        'additionalIdentifiers',
        'relationships',
      ]);
    });

    it('should map profile type correctly', () => {
      expect(formSectionMap.profile.component).toBe(Profile);
      expect(formSectionMap.profile.refKey).toBe('profileRef');
    });

    it('should map address type correctly', () => {
      expect(formSectionMap.address.component).toBe(AddressInfo);
      expect(formSectionMap.address.refKey).toBe('addressRef');
    });

    it('should map contactInfo type correctly', () => {
      expect(formSectionMap.contactInfo.component).toBe(ContactInfo);
      expect(formSectionMap.contactInfo.refKey).toBe('contactRef');
    });

    it('should map additionalInfo type correctly', () => {
      expect(formSectionMap.additionalInfo.component).toBe(AdditionalInfo);
      expect(formSectionMap.additionalInfo.refKey).toBe('additionalRef');
    });

    it('should map additionalIdentifiers type correctly', () => {
      expect(formSectionMap.additionalIdentifiers.component).toBe(
        AdditionalIdentifiers,
      );
      expect(formSectionMap.additionalIdentifiers.refKey).toBe(
        'identifiersRef',
      );
    });

    it('should map relationships type correctly', () => {
      expect(formSectionMap.relationships.component).toBe(
        PatientRelationships,
      );
      expect(formSectionMap.relationships.refKey).toBe('relationshipsRef');
    });
  });

  describe('getFormControlConfig', () => {
    it('should return config for valid profile type', () => {
      const config = getFormControlConfig('profile');
      expect(config).toBeDefined();
      expect(config?.component).toBe(Profile);
      expect(config?.refKey).toBe('profileRef');
    });

    it('should return config for valid address type', () => {
      const config = getFormControlConfig('address');
      expect(config).toBeDefined();
      expect(config?.component).toBe(AddressInfo);
    });

    it('should return config for valid contactInfo type', () => {
      const config = getFormControlConfig('contactInfo');
      expect(config).toBeDefined();
      expect(config?.component).toBe(ContactInfo);
    });

    it('should return config for valid additionalInfo type', () => {
      const config = getFormControlConfig('additionalInfo');
      expect(config).toBeDefined();
      expect(config?.component).toBe(AdditionalInfo);
    });

    it('should return config for valid additionalIdentifiers type', () => {
      const config = getFormControlConfig('additionalIdentifiers');
      expect(config).toBeDefined();
      expect(config?.component).toBe(AdditionalIdentifiers);
    });

    it('should return config for valid relationships type', () => {
      const config = getFormControlConfig('relationships');
      expect(config).toBeDefined();
      expect(config?.component).toBe(PatientRelationships);
    });

    it('should return undefined for unknown type', () => {
      const config = getFormControlConfig('unknownType');
      expect(config).toBeUndefined();
    });

    it('should return undefined for null-like strings', () => {
      expect(getFormControlConfig('')).toBeUndefined();
      expect(getFormControlConfig('null')).toBeUndefined();
    });
  });

  describe('isValidFormControlType', () => {
    it('should return true for valid profile type', () => {
      expect(isValidFormControlType('profile')).toBe(true);
    });

    it('should return true for valid address type', () => {
      expect(isValidFormControlType('address')).toBe(true);
    });

    it('should return true for valid contactInfo type', () => {
      expect(isValidFormControlType('contactInfo')).toBe(true);
    });

    it('should return true for valid additionalInfo type', () => {
      expect(isValidFormControlType('additionalInfo')).toBe(true);
    });

    it('should return true for valid additionalIdentifiers type', () => {
      expect(isValidFormControlType('additionalIdentifiers')).toBe(true);
    });

    it('should return true for valid relationships type', () => {
      expect(isValidFormControlType('relationships')).toBe(true);
    });

    it('should return false for unknown type', () => {
      expect(isValidFormControlType('unknownType')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidFormControlType('')).toBe(false);
    });

    it('should return false for null-like strings', () => {
      expect(isValidFormControlType('null')).toBe(false);
      expect(isValidFormControlType('undefined')).toBe(false);
    });
  });
});
