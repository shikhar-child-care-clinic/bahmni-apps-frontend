import { get } from '../../api';
import { fetchHomeConfig } from '../homeConfigService';
import {
  mockHomeConfig,
  mockEmptyHomeConfig,
} from './__mocks__/homeConfigServiceMocks';

jest.mock('../../api');
const mockedGet = get as jest.MockedFunction<typeof get>;

describe('homeConfigService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchHomeConfig', () => {
    it('should fetch config from correct URL', async () => {
      mockedGet.mockResolvedValue(mockHomeConfig);

      await fetchHomeConfig();

      expect(mockedGet).toHaveBeenCalledWith(
        '/bahmni_config/openmrs/apps/home/v2/extension.json',
      );
    });

    it('should return config with sorted modules', async () => {
      const unsortedConfig = {
        modules: [
          { id: 'zebra', order: 3 },
          { id: 'apple', order: 1 },
          { id: 'beta', order: 2 },
        ],
      };

      mockedGet.mockResolvedValue(unsortedConfig);

      const result = await fetchHomeConfig();

      expect(result.modules[0].id).toBe('apple');
      expect(result.modules[1].id).toBe('beta');
      expect(result.modules[2].id).toBe('zebra');
    });

    it('should sort modules alphabetically when order is missing', async () => {
      const configWithoutOrder = {
        modules: [{ id: 'zebra' }, { id: 'apple' }, { id: 'beta' }],
      };

      mockedGet.mockResolvedValue(configWithoutOrder);

      const result = await fetchHomeConfig();

      expect(result.modules[0].id).toBe('apple');
      expect(result.modules[1].id).toBe('beta');
      expect(result.modules[2].id).toBe('zebra');
    });

    it('should sort by order first, then alphabetically', async () => {
      const mixedConfig = {
        modules: [
          { id: 'zebra', order: 1 },
          { id: 'apple' },
          { id: 'beta', order: 1 },
        ],
      };

      mockedGet.mockResolvedValue(mixedConfig);

      const result = await fetchHomeConfig();

      expect(result.modules[0].id).toBe('beta');
      expect(result.modules[1].id).toBe('zebra');
      expect(result.modules[2].id).toBe('apple');
    });

    it('should throw error when modules array is missing', async () => {
      mockedGet.mockResolvedValue({});

      await expect(fetchHomeConfig()).rejects.toThrow();
    });

    it('should throw error when response is null', async () => {
      mockedGet.mockResolvedValue(null);

      await expect(fetchHomeConfig()).rejects.toThrow();
    });

    it('should throw error when API call fails', async () => {
      mockedGet.mockRejectedValue(new Error('Network error'));

      await expect(fetchHomeConfig()).rejects.toThrow();
    });

    it('should return empty config when modules array is empty', async () => {
      mockedGet.mockResolvedValue(mockEmptyHomeConfig);

      const result = await fetchHomeConfig();

      expect(result.modules).toEqual([]);
    });

    it('should preserve all module properties during sorting', async () => {
      mockedGet.mockResolvedValue(mockHomeConfig);

      const result = await fetchHomeConfig();

      const firstModule = result.modules[0];
      expect(firstModule).toHaveProperty('id');
      expect(firstModule).toHaveProperty('label');
      expect(firstModule).toHaveProperty('icon');
      expect(firstModule).toHaveProperty('order');
      expect(firstModule).toHaveProperty('url');
      expect(firstModule).toHaveProperty('privileges');
    });
  });
});
