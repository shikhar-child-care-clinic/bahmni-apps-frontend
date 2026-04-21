import { get, del, post } from '../../api';
import { BAHMNI_USER_COOKIE_NAME } from '../../constants/app';
import { getCookieByName, deleteCookie } from '../../utils';
import {
  mockUsername,
  mockEncodedUsername,
  mockQuotedUsername,
  mockSpecialUsername,
  mockEncodedSpecialUsername,
  mockUserResponse,
  mockEncodedUserLocationCookie,
  mockUserLocation,
  mockAvailableLocations,
} from '../__mocks__/mocks';
import {
  USER_RESOURCE_URL,
  BAHMNI_USER_LOCATION_COOKIE,
  LOGOUT_URL,
  LOGOUT_COOKIES,
  AVAILABLE_LOCATIONS_URL,
  SAVE_USER_LOCATION_URL,
} from '../constants';
import {
  getCurrentUser,
  getUserLoginLocation,
  logout,
  getAvailableLocations,
  saveUserLocation,
} from '../userService';

jest.mock('../../api');
jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  getCookieByName: jest.fn(),
  deleteCookie: jest.fn(),
}));

jest.mock('i18next', () => ({
  __esModule: true,
  default: {
    t: jest.fn().mockImplementation((key: string) => key),
  },
}));

const mockPost = post as jest.Mock;

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (get as jest.Mock).mockReset();
    (getCookieByName as jest.Mock).mockReset();
  });

  describe('getCurrentUser', () => {
    it('should fetch user successfully when cookie exists', async () => {
      (getCookieByName as jest.Mock).mockReturnValue(mockUsername);
      (get as jest.Mock).mockResolvedValue(mockUserResponse);

      const result = await getCurrentUser();

      expect(getCookieByName).toHaveBeenCalledWith(BAHMNI_USER_COOKIE_NAME);
      expect(get).toHaveBeenCalledWith(USER_RESOURCE_URL(mockUsername));
      expect(result).toEqual(mockUserResponse.results[0]);
    });

    it.each([
      ['URL-encoded', mockEncodedUsername],
      ['quoted', mockQuotedUsername],
    ])('should handle %s username in cookie', async (_label, cookieValue) => {
      (getCookieByName as jest.Mock).mockReturnValue(cookieValue);
      (get as jest.Mock).mockResolvedValue(mockUserResponse);

      const result = await getCurrentUser();

      expect(get).toHaveBeenCalledWith(USER_RESOURCE_URL(mockUsername));
      expect(result).toEqual(mockUserResponse.results[0]);
    });

    it('should handle special characters in username', async () => {
      (getCookieByName as jest.Mock).mockReturnValue(
        mockEncodedSpecialUsername,
      );
      const specialUserResponse = {
        results: [
          { ...mockUserResponse.results[0], username: mockSpecialUsername },
        ],
      };
      (get as jest.Mock).mockResolvedValue(specialUserResponse);

      const result = await getCurrentUser();

      expect(get).toHaveBeenCalledWith(USER_RESOURCE_URL(mockSpecialUsername));
      expect(result).toEqual(specialUserResponse.results[0]);
    });

    it.each([
      ['cookie is not found', null],
      ['cookie is empty string', ''],
    ])('should return null when %s', async (_label, cookieValue) => {
      (getCookieByName as jest.Mock).mockReturnValue(cookieValue);

      const result = await getCurrentUser();

      expect(result).toBeNull();
      expect(get).not.toHaveBeenCalled();
    });

    it.each([
      ['empty results', { results: [] }],
      ['null results', { results: null }],
    ])('should return null when API returns %s', async (_label, response) => {
      (getCookieByName as jest.Mock).mockReturnValue(mockUsername);
      (get as jest.Mock).mockResolvedValue(response);

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });

    it.each([
      ['API call fails', mockUsername],
      ['username decoding fails', '%invalid'],
      ['cookie value is malformed', '%%%invalid%%%'],
    ])('should throw error when %s', async (_label, cookieValue) => {
      (getCookieByName as jest.Mock).mockReturnValue(cookieValue);
      (get as jest.Mock).mockRejectedValue(new Error('API Error'));

      await expect(getCurrentUser()).rejects.toThrow(
        'ERROR_FETCHING_USER_DETAILS',
      );
    });

    it('should handle whitespace in username', async () => {
      const usernameWithSpace = 'super man';
      (getCookieByName as jest.Mock).mockReturnValue(
        encodeURIComponent(usernameWithSpace),
      );
      const spaceUserResponse = {
        results: [
          { ...mockUserResponse.results[0], username: usernameWithSpace },
        ],
      };
      (get as jest.Mock).mockResolvedValue(spaceUserResponse);

      const result = await getCurrentUser();

      expect(get).toHaveBeenCalledWith(USER_RESOURCE_URL(usernameWithSpace));
      expect(result).toEqual(spaceUserResponse.results[0]);
    });

    it('should return first result when API returns multiple results', async () => {
      (getCookieByName as jest.Mock).mockReturnValue(mockUsername);
      const multipleResults = {
        results: [
          mockUserResponse.results[0],
          { ...mockUserResponse.results[0], uuid: 'user-uuid-456' },
        ],
      };
      (get as jest.Mock).mockResolvedValue(multipleResults);

      const result = await getCurrentUser();

      expect(result).toEqual(multipleResults.results[0]);
    });
  });
});

describe('getUserLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCookieByName as jest.Mock).mockReset();
  });

  it('should fetch user log in location successfully when cookie exists', () => {
    (getCookieByName as jest.Mock).mockReturnValue(
      mockEncodedUserLocationCookie,
    );

    const result = getUserLoginLocation();

    expect(getCookieByName).toHaveBeenCalledWith(BAHMNI_USER_LOCATION_COOKIE);
    expect(result).toEqual(mockUserLocation);
  });

  it.each([
    ['cookie does not exist', null],
    ['login location uuid is missing', '%7B%22name%22%3A%22OPD-1%22%7D'],
  ])('should throw error when %s', (_label, cookieValue) => {
    (getCookieByName as jest.Mock).mockReturnValue(cookieValue);

    expect(() => getUserLoginLocation()).toThrow(
      'ERROR_FETCHING_USER_LOCATION_DETAILS',
    );
  });

  it('should fetch location when only name is missing', () => {
    const uuidOnlyCookie =
      '%7B%22uuid%22%3A%22b5da9afd-b29a-4cbf-91c9-ccf2aa5f799e%22%7D';
    (getCookieByName as jest.Mock).mockReturnValue(uuidOnlyCookie);

    const result = getUserLoginLocation();

    expect(getCookieByName).toHaveBeenCalledWith(BAHMNI_USER_LOCATION_COOKIE);
    expect(result).toEqual({
      uuid: 'b5da9afd-b29a-4cbf-91c9-ccf2aa5f799e',
    });
  });
});

describe('getAvailableLocations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (get as jest.Mock).mockReset();
  });

  it('should return locations when API call succeeds', async () => {
    (get as jest.Mock).mockResolvedValue({ results: mockAvailableLocations });

    const result = await getAvailableLocations();

    expect(get).toHaveBeenCalledWith(AVAILABLE_LOCATIONS_URL);
    expect(result).toEqual(mockAvailableLocations);
  });

  it.each([
    ['results is null', { results: null }],
    ['API call fails', null],
  ])('should return empty array when %s', async (_label, response) => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    if (response) {
      (get as jest.Mock).mockResolvedValue(response);
    } else {
      (get as jest.Mock).mockRejectedValue(new Error('Network error'));
    }

    const result = await getAvailableLocations();

    expect(result).toEqual([]);
    consoleErrorSpy.mockRestore();
  });
});

describe('saveUserLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPost.mockReset();
  });

  it('should call post with correct URL and body', async () => {
    mockPost.mockResolvedValue({});

    await saveUserLocation('user-uuid-123', {
      name: 'Ward 1',
      uuid: 'loc-uuid-456',
    });

    expect(mockPost).toHaveBeenCalledWith(
      SAVE_USER_LOCATION_URL('user-uuid-123'),
      { userProperties: { loginLocation: 'loc-uuid-456' } },
    );
  });

  it('should propagate error when API call fails', async () => {
    mockPost.mockRejectedValue(new Error('Server error'));

    await expect(
      saveUserLocation('user-uuid', { name: 'Ward', uuid: 'loc-uuid' }),
    ).rejects.toThrow('Server error');
  });
});

describe('logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (del as jest.Mock).mockReset();
    (deleteCookie as jest.Mock).mockReset();
  });

  it('should delete session and clear all required cookies', async () => {
    (del as jest.Mock).mockResolvedValue({});

    await logout();

    expect(del).toHaveBeenCalledWith(LOGOUT_URL);
    expect(deleteCookie).toHaveBeenCalledTimes(LOGOUT_COOKIES.length);
    LOGOUT_COOKIES.forEach((cookieName) => {
      expect(deleteCookie).toHaveBeenCalledWith(cookieName);
    });
  });

  it('should throw error and not clear cookies when API call fails', async () => {
    (del as jest.Mock).mockRejectedValue(new Error('Network error'));

    await expect(logout()).rejects.toThrow('USER_LOGOUT_FAILED');
    expect(deleteCookie).not.toHaveBeenCalled();
  });
});
