import { useUserPrivilege } from '@bahmni/widgets';
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { getVisibleModules } from '../../../../services/moduleService';
import { HomePageGrid } from '../HomePageGrid';
import { mockModules, mockEmptyModules } from './__mocks__/homePageGridMocks';

expect.extend(toHaveNoViolations);

jest.mock('../../AppTile', () => ({
  AppTile: ({ id, label }: any) => (
    <div data-testid={`app-tile-${id}`}>
      <span>{label}</span>
    </div>
  ),
}));

jest.mock('../../../../services/moduleService', () => ({
  getVisibleModules: jest.fn(),
}));

jest.mock('@bahmni/widgets', () => ({
  useUserPrivilege: jest.fn(),
}));

const mockGetVisibleModules = getVisibleModules as jest.MockedFunction<
  typeof getVisibleModules
>;

const mockUseUserPrivilege = useUserPrivilege as jest.MockedFunction<
  typeof useUserPrivilege
>;

const mockPrivileges = [
  { uuid: 'priv-1', name: 'View Clinical Module' },
  { uuid: 'priv-2', name: 'View Registration Module' },
  { uuid: 'priv-3', name: 'View Inpatient Module' },
];

describe('HomePageGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: mockPrivileges,
      setUserPrivileges: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
    });
  });

  it('renders loading skeleton while privileges are loading', () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: null,
      setUserPrivileges: jest.fn(),
      isLoading: true,
      setIsLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
    });

    const { container } = render(<HomePageGrid />);

    const skeletons = container.querySelectorAll('.skeletonTile');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders grid with tiles for each module', async () => {
    mockGetVisibleModules.mockResolvedValue(mockModules);

    render(<HomePageGrid />);

    await waitFor(() => {
      expect(screen.getByTestId('app-tile-clinical')).toBeInTheDocument();
    });

    expect(screen.getByTestId('app-tile-registration')).toBeInTheDocument();
    expect(screen.getByTestId('app-tile-inpatient')).toBeInTheDocument();
  });

  it('renders empty state when no modules available', async () => {
    mockGetVisibleModules.mockResolvedValue(mockEmptyModules);

    render(<HomePageGrid />);

    await waitFor(() => {
      const statusEl = screen.getByRole('status');
      expect(statusEl).toBeInTheDocument();
      expect(statusEl).toHaveTextContent('No modules available');
    });
  });

  it('passes module data to AppTile components', async () => {
    mockGetVisibleModules.mockResolvedValue(mockModules);

    render(<HomePageGrid />);

    await waitFor(() => {
      mockModules.forEach((module) => {
        expect(screen.getByTestId(`app-tile-${module.id}`)).toBeInTheDocument();
      });
    });
  });

  it('calls getVisibleModules with mapped privilege names', async () => {
    mockGetVisibleModules.mockResolvedValue(mockModules);

    render(<HomePageGrid />);

    await waitFor(() => {
      expect(mockGetVisibleModules).toHaveBeenCalledWith(
        'org.bahmni.home.dashboard',
        [
          'View Clinical Module',
          'View Registration Module',
          'View Inpatient Module',
        ],
      );
    });
  });

  it('calls getVisibleModules with empty array when user has no privileges', async () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [],
      setUserPrivileges: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
    });
    mockGetVisibleModules.mockResolvedValue([]);

    render(<HomePageGrid />);

    await waitFor(() => {
      expect(mockGetVisibleModules).toHaveBeenCalledWith(
        'org.bahmni.home.dashboard',
        [],
      );
    });
  });

  it('loading state has role="status" and aria-busy="true"', () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: null,
      setUserPrivileges: jest.fn(),
      isLoading: true,
      setIsLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
    });

    render(<HomePageGrid />);

    const statusEl = screen.getByRole('status');
    expect(statusEl).toHaveAttribute('aria-busy', 'true');
    expect(statusEl).toHaveAttribute('aria-label', 'Loading modules');
  });

  it('shows error notification when module loading fails', async () => {
    mockGetVisibleModules.mockRejectedValue(new Error('Network error'));

    render(<HomePageGrid />);

    await waitFor(() => {
      expect(screen.getByTestId('home-error')).toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText('Failed to load home page configuration'),
    ).toBeInTheDocument();
  });

  it('has no accessibility violations in normal state', async () => {
    mockGetVisibleModules.mockResolvedValue(mockModules);

    const { container } = render(<HomePageGrid />);

    await waitFor(() => {
      expect(screen.getByTestId('app-tile-clinical')).toBeInTheDocument();
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
