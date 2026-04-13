import { BAHMNI_ICON_NAMES } from '../constants';
import { getIcon, isValidIconName, bahmniIconRegistry } from '../iconRegistry';

describe('iconRegistry', () => {
  describe('bahmniIconRegistry', () => {
    it('should have 15 icons registered', () => {
      const registrySize = Object.keys(bahmniIconRegistry).length;
      expect(registrySize).toBe(15);
    });

    it('should have REGISTRATION icon', () => {
      expect(bahmniIconRegistry[BAHMNI_ICON_NAMES.REGISTRATION]).toBeDefined();
    });

    it('should have CLINICAL icon', () => {
      expect(bahmniIconRegistry[BAHMNI_ICON_NAMES.CLINICAL]).toBeDefined();
    });

    it('should have NAVIGATION icon', () => {
      expect(bahmniIconRegistry[BAHMNI_ICON_NAMES.NAVIGATION]).toBeDefined();
    });
  });

  describe('getIcon', () => {
    it('should return null for invalid icon name', () => {
      const icon = getIcon('invalid_icon_name');
      expect(icon).toBeNull();
    });

    it('should return null for empty string', () => {
      const icon = getIcon('');
      expect(icon).toBeNull();
    });

    it('should get registration icon by direct registry access', () => {
      const registryIcon = bahmniIconRegistry[BAHMNI_ICON_NAMES.REGISTRATION];
      expect(registryIcon).toBeDefined();
      expect(
        typeof registryIcon === 'function' || typeof registryIcon === 'object',
      ).toBe(true);
    });
  });

  describe('isValidIconName', () => {
    it('should return true for REGISTRATION icon name', () => {
      expect(isValidIconName(BAHMNI_ICON_NAMES.REGISTRATION)).toBe(true);
    });

    it('should return true for CLINICAL icon name', () => {
      expect(isValidIconName(BAHMNI_ICON_NAMES.CLINICAL)).toBe(true);
    });

    it('should return true for NAVIGATION icon name', () => {
      expect(isValidIconName(BAHMNI_ICON_NAMES.NAVIGATION)).toBe(true);
    });

    it('should return false for invalid icon name', () => {
      expect(isValidIconName('invalid_icon')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidIconName('')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(
        isValidIconName(BAHMNI_ICON_NAMES.REGISTRATION.toUpperCase()),
      ).toBe(false);
    });
  });
});
