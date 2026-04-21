import {
  getUserLoginLocation,
  getAvailableLocations,
  getCurrentUser,
  saveUserLocation,
  setCookie,
} from '@bahmni/services';
import { render, screen, waitFor, act } from '@testing-library/react';
import { LocationProvider } from '../../../context/LocationProvider';
import { mockLocation, mockLocations, mockUser } from '../__mocks__/mocks';
import { LocationSelector } from '../LocationSelector';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getUserLoginLocation: jest.fn(),
  getAvailableLocations: jest.fn(),
  getCurrentUser: jest.fn(),
  saveUserLocation: jest.fn(),
  setCookie: jest.fn(),
}));

jest.mock('@bahmni/design-system', () => ({
  Dropdown: ({
    label,
    titleText,
    onChange,
    items,
    itemToString,
    ...props
  }: any) => (
    <div {...props}>
      <label>{titleText}</label>
      <div>{label}</div>
      {items?.map((item: any) => (
        <button
          key={item.uuid}
          data-testid={`location-option-${item.uuid}`}
          onClick={() => onChange?.({ selectedItem: item })}
        >
          {itemToString?.(item) ?? item.name}
        </button>
      ))}
    </div>
  ),
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
const mockSetCookie = setCookie as jest.MockedFunction<typeof setCookie>;

describe('LocationSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockGetUserLoginLocation.mockReturnValue(mockLocation);
    mockGetAvailableLocations.mockResolvedValue(mockLocations);
    mockGetCurrentUser.mockResolvedValue(mockUser);
    (saveUserLocation as jest.Mock).mockResolvedValue(undefined);
    mockSetCookie.mockImplementation(() => {});
  });

  it('renders dropdown with current location name', async () => {
    render(
      <LocationProvider>
        <LocationSelector />
      </LocationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('location-selector')).toBeInTheDocument();
      expect(screen.getAllByText(mockLocation.name).length).toBeGreaterThan(0);
    });
  });

  it.each([
    ['Failed to fetch', 'Failed to fetch'],
    ['Failed to fetch location', 'Failed to fetch location'],
  ])(
    'displays error state with message "%s"',
    async (errorMessage, expectedText) => {
      mockGetUserLoginLocation.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      render(
        <LocationProvider>
          <LocationSelector />
        </LocationProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('location-error')).toBeInTheDocument();
        expect(screen.getByText(expectedText)).toBeInTheDocument();
      });
    },
  );

  it('changes location when a different location is selected', async () => {
    render(
      <LocationProvider>
        <LocationSelector />
      </LocationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('location-selector')).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByTestId('location-option-location-uuid-456').click();
    });

    expect(mockSetCookie).toHaveBeenCalledWith(
      'bahmni.user.location',
      expect.stringContaining('location-uuid-456'),
    );
  });

  it('does not change when same location is selected', async () => {
    render(
      <LocationProvider>
        <LocationSelector />
      </LocationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('location-selector')).toBeInTheDocument();
    });

    mockSetCookie.mockClear();

    await act(async () => {
      screen.getByTestId('location-option-location-uuid-123').click();
    });

    expect(mockSetCookie).not.toHaveBeenCalled();
  });

  it('handles location change error from provider gracefully', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mockSetCookie.mockImplementation(() => {
      throw new Error('Cookie write failed');
    });

    render(
      <LocationProvider>
        <LocationSelector />
      </LocationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('location-selector')).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByTestId('location-option-location-uuid-456').click();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error updating location:',
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it('logs error from LocationSelector catch when setLocation throws', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const { LocationContext } = jest.requireActual(
      '../../../context/LocationContext',
    );

    render(
      <LocationContext.Provider
        value={{
          location: { name: 'General Ward', uuid: 'location-uuid-123' },
          setLocation: jest.fn().mockImplementation(() => {
            throw new Error('Set location failed');
          }),
          availableLocations: mockLocations,
          loading: false,
          error: null,
        }}
      >
        <LocationSelector />
      </LocationContext.Provider>,
    );

    await act(async () => {
      screen.getByTestId('location-option-location-uuid-456').click();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to change location:',
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it('displays no-location message when location is null', () => {
    const { LocationContext } = jest.requireActual(
      '../../../context/LocationContext',
    );

    render(
      <LocationContext.Provider
        value={{
          location: null,
          setLocation: jest.fn(),
          availableLocations: [],
          loading: false,
          error: null,
        }}
      >
        <LocationSelector />
      </LocationContext.Provider>,
    );

    expect(screen.getByTestId('location-no-selection')).toBeInTheDocument();
  });

  it('displays loading state while locations are being fetched', () => {
    mockGetAvailableLocations.mockImplementation(() => new Promise(() => {}));

    render(
      <LocationProvider>
        <LocationSelector />
      </LocationProvider>,
    );

    expect(screen.getByTestId('location-loading')).toBeInTheDocument();
  });
});
