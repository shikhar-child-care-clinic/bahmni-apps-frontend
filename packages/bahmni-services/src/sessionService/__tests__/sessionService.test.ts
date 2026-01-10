import * as api from '../../api';
import * as errorHandling from '../../errorHandling';
import { LoginCredentials } from '../models';
import {
  loginUser,
  updateSessionLocation,
  logoutUser,
  checkSession,
} from '../sessionService';

jest.mock('../../api');
jest.mock('../../errorHandling');

const mockGet = api.get as jest.MockedFunction<typeof api.get>;
const mockPost = api.post as jest.MockedFunction<typeof api.post>;
const mockDel = api.del as jest.MockedFunction<typeof api.del>;
const mockGetFormattedError =
  errorHandling.getFormattedError as jest.MockedFunction<
    typeof errorHandling.getFormattedError
  >;

describe('sessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.cookie =
      'bahmni.user=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
    document.cookie =
      'bahmni.user.location=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
  });

  describe('loginUser', () => {
    const credentials: LoginCredentials = {
      username: 'testuser',
      password: 'testpass123',
    };

    it('should successfully login with valid credentials and set cookie', async () => {
      const mockResponse = {
        authenticated: true,
        user: { uuid: '123', username: 'testuser' },
        sessionId: 'session123',
      };

      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await loginUser(credentials);

      expect(result).toEqual(mockResponse);
      expect(result.authenticated).toBe(true);
      expect(result.user?.username).toBe('testuser');
      expect(document.cookie).toContain('bahmni.user=testuser');
    });

    it('should throw formatted error for invalid credentials (401)', async () => {
      const error = { response: { status: 401 } };
      mockGet.mockRejectedValueOnce(error);
      mockGetFormattedError.mockReturnValueOnce({
        title: 'Unauthorized',
        message:
          'The username or password provided is incorrect. Please try again.',
      });

      await expect(loginUser(credentials)).rejects.toThrow('Unauthorized');
      expect(mockGetFormattedError).toHaveBeenCalledWith(error);
    });

    it('should throw formatted error for network failures', async () => {
      const error = new Error('Network error');
      mockGet.mockRejectedValueOnce(error);
      mockGetFormattedError.mockReturnValueOnce({
        title: 'Network Error',
        message:
          'Unable to connect to the server. Please check your internet connection.',
      });

      await expect(loginUser(credentials)).rejects.toThrow('Network Error');
      expect(mockGetFormattedError).toHaveBeenCalledWith(error);
    });

    it('should throw formatted error for server errors (500)', async () => {
      const error = { response: { status: 500 } };
      mockGet.mockRejectedValueOnce(error);
      mockGetFormattedError.mockReturnValueOnce({
        title: 'Server Error',
        message: 'The server encountered an error. Please try again later.',
      });

      await expect(loginUser(credentials)).rejects.toThrow('Server Error');
      expect(mockGetFormattedError).toHaveBeenCalledWith(error);
    });

    it('should not set cookie when authentication fails', async () => {
      const mockResponse = {
        authenticated: false,
      };

      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await loginUser(credentials);

      expect(result.authenticated).toBe(false);
      expect(document.cookie).not.toContain('bahmni.user=');
    });

    it('should not set cookie when user is undefined despite authenticated being true', async () => {
      const mockResponse = {
        authenticated: true,
        user: undefined,
      };

      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await loginUser(credentials);

      expect(result.authenticated).toBe(true);
      expect(result.user).toBeUndefined();
      expect(document.cookie).not.toContain('bahmni.user=');
    });
  });

  describe('updateSessionLocation', () => {
    it('should update session location and set cookie', async () => {
      const locationUuid = 'location-123';
      const mockResponse = {
        authenticated: true,
        sessionLocation: locationUuid,
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await updateSessionLocation(locationUuid);

      expect(result).toEqual(mockResponse);
      expect(document.cookie).toContain('bahmni.user.location=location-123');
      expect(mockPost).toHaveBeenCalledWith(
        expect.stringContaining('/session'),
        { sessionLocation: locationUuid },
      );
    });

    it('should throw error on update failure', async () => {
      mockPost.mockRejectedValueOnce(new Error('Update failed'));

      await expect(updateSessionLocation('location-123')).rejects.toThrow(
        'Update failed',
      );
    });
  });

  describe('logoutUser', () => {
    it('should logout and clear cookies', async () => {
      document.cookie = 'bahmni.user=testuser';
      document.cookie = 'bahmni.user.location=location-123';

      mockDel.mockResolvedValueOnce(undefined);

      await logoutUser();

      expect(mockDel).toHaveBeenCalledWith(expect.stringContaining('/session'));
      expect(document.cookie).not.toContain('bahmni.user=testuser');
    });

    it('should ensure cookies are deleted even when server logout request fails', async () => {
      document.cookie = 'bahmni.user=testuser';
      document.cookie = 'bahmni.user.location=location-123';

      mockDel.mockRejectedValueOnce(new Error('Network error'));

      await expect(logoutUser()).rejects.toThrow('Network error');

      expect(document.cookie).not.toContain('bahmni.user=testuser');
      expect(document.cookie).not.toContain('bahmni.user.location');
    });
  });

  describe('checkSession', () => {
    it('should return authenticated session data', async () => {
      const mockResponse = {
        authenticated: true,
        user: { uuid: '123', username: 'testuser' },
      };

      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await checkSession();

      expect(result.authenticated).toBe(true);
      expect(result.user).toEqual(mockResponse.user);
    });

    it('should throw error when session check fails', async () => {
      mockGet.mockRejectedValueOnce(new Error('Session check failed'));

      await expect(checkSession()).rejects.toThrow('Session check failed');
    });
  });
});
