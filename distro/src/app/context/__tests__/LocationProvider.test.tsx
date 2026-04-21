import {
  getUserLoginLocation,
  getAvailableLocations,
  getCurrentUser,
  saveUserLocation,
  setCookie,
} from '@bahmni/services';
import { renderHook, act } from '@testing-library/react';
import {
  mockLocation,
  newLocation,
  mockLocations,
  mockUser,
} from '../__mocks__/mocks';
import { useLocation } from '../LocationContext';
import { LocationProvider } from '../LocationProvider';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getUserLoginLocation: jest.fn(),
  getAvailableLocations: jest.fn(),
  getCurrentUser: jest.fn(),
  saveUserLocation: jest.fn(),
  setCookie: jest.fn(),
}));

const mockGetUserLoginLocation = getUserLoginLocation as jest.MockedFunction<
  typeof getUserLoginLocation
>;
const mockGetAvailableLocations = getAvailableLocations as jest.MockedFunction<
  typeof getAvailableLocations
>;
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;
const mockSaveUserLocation = saveUserLocation as jest.MockedFunction<
  typeof saveUserLocation
>;
const mockSetCookie = setCookie as jest.MockedFunction<typeof setCookie>;

describe('LocationProvider - Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserLoginLocation.mockReturnValue(mockLocation);
    mockGetAvailableLocations.mockResolvedValue(mockLocations);
    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockSaveUserLocation.mockResolvedValue(undefined);
    mockSetCookie.mockImplementation(() => {});
  });

  const renderLocationHook = () => {
    const wrapper = ({ children }: any) => (
      <LocationProvider>{children}</LocationProvider>
    );
    return renderHook(() => useLocation(), { wrapper });
  };

  const waitForInit = async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  };

  it('writes cookie and persists to server when location is changed', async () => {
    const { result } = renderLocationHook();
    await waitForInit();

    act(() => {
      result.current.setLocation(newLocation);
    });

    expect(mockSetCookie).toHaveBeenCalledWith(
      'bahmni.user.location',
      encodeURIComponent(JSON.stringify(newLocation)),
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(mockSaveUserLocation).toHaveBeenCalledWith(
      mockUser.uuid,
      newLocation,
    );
  });

  it('does not call saveUserLocation if userUuid is null', async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const { result } = renderLocationHook();
    await waitForInit();

    act(() => {
      result.current.setLocation(newLocation);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(mockSaveUserLocation).not.toHaveBeenCalled();
  });

  it('continues on cookie update even if saveUserLocation fails', async () => {
    mockSaveUserLocation.mockRejectedValue(new Error('Server error'));
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const { result } = renderLocationHook();
    await waitForInit();

    act(() => {
      result.current.setLocation(newLocation);
    });

    expect(result.current.location).toEqual(newLocation);
    expect(mockSetCookie).toHaveBeenCalled();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Failed to save location to server:',
      expect.any(Error),
    );
    consoleWarnSpy.mockRestore();
  });

  it('handles null location without calling setCookie or saveUserLocation', async () => {
    const { result } = renderLocationHook();
    await waitForInit();

    mockSetCookie.mockClear();

    act(() => {
      result.current.setLocation(null);
    });

    expect(mockSetCookie).not.toHaveBeenCalled();
    expect(mockSaveUserLocation).not.toHaveBeenCalled();
  });

  it.each([
    {
      thrown: new Error('Cookie write failed'),
      expectedError: 'Cookie write failed',
      label: 'Error instance',
    },
    {
      thrown: 'string error',
      expectedError: 'Failed to update location',
      label: 'non-Error value',
    },
  ])(
    'reverts location and sets error when setCookie throws $label',
    async ({ thrown, expectedError }) => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const { result } = renderLocationHook();
      await waitForInit();

      const originalLocation = result.current.location;

      mockSetCookie.mockImplementation(() => {
        throw thrown;
      });

      act(() => {
        result.current.setLocation({ name: 'Bad Ward', uuid: 'bad-uuid' });
      });

      expect(result.current.location).toEqual(originalLocation);
      expect(result.current.error).toBe(expectedError);

      consoleErrorSpy.mockRestore();
    },
  );

  it('fetches user UUID on mount for persistence', async () => {
    renderLocationHook();
    await waitForInit();

    expect(mockGetCurrentUser).toHaveBeenCalled();
  });
});
