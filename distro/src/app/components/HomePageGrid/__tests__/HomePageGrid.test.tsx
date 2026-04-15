import { useTranslation } from '@bahmni/services';
import { render, screen, waitFor } from '@testing-library/react';
import { getVisibleModules } from '../../../../services/moduleService';
import { HomePageGrid } from '../HomePageGrid';
import { mockModules, mockEmptyModules } from './__mocks__/homePageGridMocks';

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

jest.mock('@bahmni/services', () => ({
  useTranslation: jest.fn(),
}));

const mockGetVisibleModules = getVisibleModules as jest.MockedFunction<
  typeof getVisibleModules
>;
const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

describe('HomePageGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          HOME_ERROR_FETCH_CONFIG: 'Failed to load home page configuration',
        };
        return translations[key] || key;
      },
    } as any);
  });

  it('renders loading skeleton on mount', () => {
    mockGetVisibleModules.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        }),
    );

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
      expect(screen.getByText('No modules available')).toBeInTheDocument();
    });
  });

  it('renders error message on fetch failure', async () => {
    mockGetVisibleModules.mockRejectedValue(
      new Error('Failed to load extensions'),
    );

    render(<HomePageGrid />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load home page configuration'),
      ).toBeInTheDocument();
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
});
