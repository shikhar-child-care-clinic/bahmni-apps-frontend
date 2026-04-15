import {
  useTranslation,
  getUserLoginLocation,
  getAvailableLocations,
} from '@bahmni/services';
import { render, screen, waitFor } from '@testing-library/react';
import { LocationProvider } from '../../../context/LocationProvider';
import { LocationSelector } from '../LocationSelector';

jest.mock('@bahmni/services', () => ({
  useTranslation: jest.fn(),
  getUserLoginLocation: jest.fn(),
  getAvailableLocations: jest.fn(),
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

describe('LocationSelector', () => {
  const mockLocation = {
    name: 'General Ward',
    uuid: 'location-uuid-123',
  };

  const mockLocations = [
    { name: 'General Ward', uuid: 'location-uuid-123' },
    { name: 'ICU Ward', uuid: 'location-uuid-456' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
    } as any);

    mockGetUserLoginLocation.mockReturnValue(mockLocation);
    mockGetAvailableLocations.mockResolvedValue(mockLocations);
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

  it('uses translation key for select location label', async () => {
    render(
      <LocationProvider>
        <LocationSelector />
      </LocationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('HOME_SELECT_LOCATION')).toBeInTheDocument();
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
