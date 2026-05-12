import {
  fetchWhiteLabelConfig,
  stripHeaderHtml,
  resetWhiteLabelCacheForTest,
} from '../whiteLabelService';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('whiteLabelService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetWhiteLabelCacheForTest();
  });

  describe('fetchWhiteLabelConfig', () => {
    it('fetches and returns whiteLabel.json from the bahmni_config mount', async () => {
      const payload = {
        homePage: {
          header_text: '<b>SHIKHAR CHILD CARE<br />AND VACCINATION CLINIC',
          title_text: 'Pediatrics | Vaccination | Pharmacy',
          logo: '/bahmni/images/bahmniLogoFull.png',
        },
        loginPage: {
          logo: '/bahmni/images/bahmniLogoFull.png',
          showHeaderText: true,
          showTitleText: false,
        },
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(payload),
      });

      const result = await fetchWhiteLabelConfig();

      expect(mockFetch).toHaveBeenCalledWith(
        '/bahmni_config/openmrs/apps/home/whiteLabel.json',
      );
      expect(result).toEqual(payload);
    });

    it('caches the response across calls', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ homePage: { header_text: 'X' } }),
      });

      await fetchWhiteLabelConfig();
      await fetchWhiteLabelConfig();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('returns empty config on non-ok response without throwing', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockFetch.mockResolvedValue({ ok: false, status: 404 });

      const result = await fetchWhiteLabelConfig();

      expect(result).toEqual({});
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('returns empty config on network error without throwing', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockFetch.mockRejectedValue(new Error('network'));

      const result = await fetchWhiteLabelConfig();

      expect(result).toEqual({});
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('stripHeaderHtml', () => {
    it('returns empty string for undefined', () => {
      expect(stripHeaderHtml(undefined)).toBe('');
    });

    it('strips <br/> and <b> tags and collapses whitespace', () => {
      expect(
        stripHeaderHtml('<b>SHIKHAR CHILD CARE<br />AND VACCINATION CLINIC'),
      ).toBe('SHIKHAR CHILD CARE AND VACCINATION CLINIC');
    });

    it('handles plain text unchanged (modulo trim)', () => {
      expect(stripHeaderHtml('  plain text  ')).toBe('plain text');
    });
  });
});
