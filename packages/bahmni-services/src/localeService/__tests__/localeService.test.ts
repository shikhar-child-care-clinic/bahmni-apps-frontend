import * as api from '../../api';
import { GLOBAL_PROPERTY_ENDPOINT } from '../../constants/app';
import { LOCALE_LANGUAGES_URL } from '../constants';
import {
  getAllowedLocalesList,
  getLocaleLanguages,
  getAvailableLocales,
} from '../localeService';

jest.mock('../../api');

describe('localeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllowedLocalesList', () => {
    it('should return array of locale codes from comma-separated value', async () => {
      const mockResponse = [{ value: 'en, fr, es' }];
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getAllowedLocalesList();

      expect(api.get).toHaveBeenCalledWith(
        `${GLOBAL_PROPERTY_ENDPOINT}?property=locale.allowed.list`,
      );
      expect(result).toEqual(['en', 'fr', 'es']);
    });

    it('should return default locale when response is empty or invalid', async () => {
      (api.get as jest.Mock).mockResolvedValue([]);

      const result = await getAllowedLocalesList();

      expect(result).toEqual(['en']);
    });

    it('should throw error on API failure', async () => {
      const mockError = new Error('API error');
      (api.get as jest.Mock).mockRejectedValue(mockError);

      await expect(getAllowedLocalesList()).rejects.toThrow(mockError);
    });
  });

  describe('getLocaleLanguages', () => {
    it('should return locale languages map', async () => {
      const mockResponse = { en: 'English', fr: 'Français', es: 'Español' };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getLocaleLanguages();

      expect(api.get).toHaveBeenCalledWith(LOCALE_LANGUAGES_URL);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on API failure', async () => {
      const mockError = new Error('Network error');
      (api.get as jest.Mock).mockRejectedValue(mockError);

      await expect(getLocaleLanguages()).rejects.toThrow(mockError);
    });
  });

  describe('getAvailableLocales', () => {
    it('should combine allowed locales and locale languages', async () => {
      const mockAllowedLocales = [{ value: 'en,fr,es' }];
      const mockLocaleLanguages = {
        en: 'English',
        fr: 'Français',
        es: 'Español',
      };

      (api.get as jest.Mock)
        .mockResolvedValueOnce(mockAllowedLocales)
        .mockResolvedValueOnce(mockLocaleLanguages);

      const result = await getAvailableLocales();

      expect(result).toEqual([
        { code: 'en', nativeName: 'English' },
        { code: 'fr', nativeName: 'Français' },
        { code: 'es', nativeName: 'Español' },
      ]);
    });

    it('should use locale code as nativeName when language not found', async () => {
      const mockAllowedLocales = [{ value: 'en,unknown' }];
      const mockLocaleLanguages = { en: 'English' };

      (api.get as jest.Mock)
        .mockResolvedValueOnce(mockAllowedLocales)
        .mockResolvedValueOnce(mockLocaleLanguages);

      const result = await getAvailableLocales();

      expect(result).toEqual([
        { code: 'en', nativeName: 'English' },
        { code: 'unknown', nativeName: 'unknown' },
      ]);
    });

    it('should throw error on API failure', async () => {
      const mockError = new Error('Failed to fetch');
      (api.get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(getAvailableLocales()).rejects.toThrow(mockError);
    });
  });
});
