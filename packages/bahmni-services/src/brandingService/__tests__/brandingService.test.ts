import * as api from '../../api';
import { getLoginBranding } from '../brandingService';
import { LOGIN_BRANDING_URL } from '../constants';

jest.mock('../../api');

describe('brandingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLoginBranding', () => {
    it('should return login branding configuration from loginPage', async () => {
      const mockResponse = {
        loginPage: {
          logo: '/bahmni_config/openmrs/apps/home/logo.png',
          showHeaderText: true,
          showTitleText: false,
        },
        homePage: {},
      };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getLoginBranding();

      expect(api.get).toHaveBeenCalledWith(LOGIN_BRANDING_URL);
      expect(result).toEqual(mockResponse.loginPage);
    });

    it('should return empty object when no loginPage in response', async () => {
      (api.get as jest.Mock).mockResolvedValue({});

      const result = await getLoginBranding();

      expect(result).toEqual({});
    });

    it('should throw error on API failure', async () => {
      const mockError = new Error('Failed to fetch branding');
      (api.get as jest.Mock).mockRejectedValue(mockError);

      await expect(getLoginBranding()).rejects.toThrow(mockError);
    });
  });
});
