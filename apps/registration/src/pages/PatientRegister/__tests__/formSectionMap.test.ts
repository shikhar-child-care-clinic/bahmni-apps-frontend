import { AdditionalIdentifiers } from '../../../components/forms/additionalIdentifiers/AdditionalIdentifiers';
import { AdditionalInfo } from '../../../components/forms/additionalInfo/AdditionalInfo';
import { AddressInfo } from '../../../components/forms/addressInfo/AddressInfo';
import { ContactInfo } from '../../../components/forms/contactInfo/ContactInfo';
import { PatientRelationships } from '../../../components/forms/patientRelationships/PatientRelationships';
import { Profile } from '../../../components/forms/profile/Profile';
import { builtInFormSections } from '../formSectionMap';

describe('formSectionMap', () => {
  describe('builtInFormSections array', () => {
    it('should have all 6 control types', () => {
      const types = builtInFormSections.map((section) => section.type);
      expect(types).toEqual([
        'profile',
        'address',
        'contactInfo',
        'additionalInfo',
        'additionalIdentifiers',
        'relationships',
      ]);
    });

    it('should map profile type correctly', () => {
      const profile = builtInFormSections.find((s) => s.type === 'profile');
      expect(profile?.component).toBe(Profile);
    });

    it('should map address type correctly', () => {
      const address = builtInFormSections.find((s) => s.type === 'address');
      expect(address?.component).toBe(AddressInfo);
    });

    it('should map contactInfo type correctly', () => {
      const contactInfo = builtInFormSections.find(
        (s) => s.type === 'contactInfo',
      );
      expect(contactInfo?.component).toBe(ContactInfo);
    });

    it('should map additionalInfo type correctly', () => {
      const additionalInfo = builtInFormSections.find(
        (s) => s.type === 'additionalInfo',
      );
      expect(additionalInfo?.component).toBe(AdditionalInfo);
    });

    it('should map additionalIdentifiers type correctly', () => {
      const additionalIdentifiers = builtInFormSections.find(
        (s) => s.type === 'additionalIdentifiers',
      );
      expect(additionalIdentifiers?.component).toBe(AdditionalIdentifiers);
    });

    it('should map relationships type correctly', () => {
      const relationships = builtInFormSections.find(
        (s) => s.type === 'relationships',
      );
      expect(relationships?.component).toBe(PatientRelationships);
    });
  });

  describe('form section validation', () => {
    const getFormControlConfig = (type: string) => {
      return builtInFormSections.find((s) => s.type === type);
    };

    const isValidFormControlType = (type: string) => {
      return getFormControlConfig(type) !== undefined;
    };

    it('should return config for valid profile type', () => {
      const config = getFormControlConfig('profile');
      expect(config).toBeDefined();
      expect(config?.component).toBe(Profile);
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
  });
});
