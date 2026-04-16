import {
  useTranslation,
  getUserLoginLocation,
  getAvailableLocations,
  getCurrentUser,
  saveUserLocation,
  setCookie,
} from '@bahmni/services';
import { render, screen, waitFor } from '@testing-library/react';
import { LocationProvider } from '../../../context/LocationProvider';
import { LocationSelector } from '../LocationSelector';

jest.mock('@bahmni/services', () => ({
  useTranslation: jest.fn(),
  getUserLoginLocation: jest.fn(),
  getAvailableLocations: jest.fn(),
  getCurrentUser: jest.fn(),
  saveUserLocation: jest.fn(),
  setCookie: jest.fn(),
}));

jest.mock('@bahmni/design-system', () => ({
  Dropdown: ({ label, titleText, ...props }: any) => (
    <div {...props}>
      <label>{titleText}</label>
      <div>{label}</div>
    </div>
  ),
}));

const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;
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

describe('LocationSelector', () => {
  const mockLocation = {
    name: 'General Ward',
    uuid: 'location-uuid-123',
  };

  const mockLocations = [
    { name: 'General Ward', uuid: 'location-uuid-123' },
    { name: 'ICU Ward', uuid: 'location-uuid-456' },
  ];

  const mockUser = {
    uuid: 'user-uuid-789',
    username: 'testuser',
    display: 'Test User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
    } as any);

    mockGetUserLoginLocation.mockReturnValue(mockLocation);
    mockGetAvailableLocations.mockResolvedValue(mockLocations);
    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockSaveUserLocation.mockResolvedValue(undefined);
    mockSetCookie.mockImplementation(() => {});
  });

  it('renders location selector dropdown', async () => {
    render(
      <LocationProvider>
        <LocationSelector />
      </LocationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('location-selector')).toBeInTheDocument();
    });
  });

  it('displays current location name', async () => {
    render(
      <LocationProvider>
        <LocationSelector />
      </LocationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(mockLocation.name)).toBeInTheDocument();
    });
  });

  it('displays error state when location fetch fails', async () => {
    mockGetUserLoginLocation.mockImplementation(() => {
      throw new Error('Failed to fetch');
    });

    render(
      <LocationProvider>
        <LocationSelector />
      </LocationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('location-error')).toBeInTheDocument();
    });
  });

  it('renders dropdown with current location as label', async () => {
    render(
      <LocationProvider>
        <LocationSelector />
      </LocationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('General Ward')).toBeInTheDocument();
    });
  });

  it('displays error message when location fetch fails', () => {
    mockGetUserLoginLocation.mockImplementation(() => {
      throw new Error('Failed to fetch location');
    });

    render(
      <LocationProvider>
        <LocationSelector />
      </LocationProvider>,
    );

    expect(screen.getByTestId('location-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch location')).toBeInTheDocument();
  });
});
