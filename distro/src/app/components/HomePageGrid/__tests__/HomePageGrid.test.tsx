import { getVisibleModules } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
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

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getVisibleModules: jest.fn(),
}));

const mockGetVisibleModules = getVisibleModules as jest.MockedFunction<
  typeof getVisibleModules
>;

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

describe('HomePageGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading skeleton on mount', () => {
    mockGetVisibleModules.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        }),
    );

    const { container } = renderWithQueryClient(<HomePageGrid />);

    const skeletons = container.querySelectorAll('.skeletonTile');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders grid with tiles for each module', async () => {
    mockGetVisibleModules.mockResolvedValue(mockModules);

    renderWithQueryClient(<HomePageGrid />);

    await waitFor(() => {
      expect(screen.getByTestId('app-tile-clinical')).toBeInTheDocument();
    });

    expect(screen.getByTestId('app-tile-registration')).toBeInTheDocument();
    expect(screen.getByTestId('app-tile-inpatient')).toBeInTheDocument();
  });

  it('renders empty state when no modules available', async () => {
    mockGetVisibleModules.mockResolvedValue(mockEmptyModules);

    renderWithQueryClient(<HomePageGrid />);

    await waitFor(() => {
      const statusEl = screen.getByRole('status');
      expect(statusEl).toBeInTheDocument();
      expect(statusEl).toHaveTextContent('No modules available');
    });
  });

  it('passes module data to AppTile components', async () => {
    mockGetVisibleModules.mockResolvedValue(mockModules);

    renderWithQueryClient(<HomePageGrid />);

    await waitFor(() => {
      mockModules.forEach((module) => {
        expect(screen.getByTestId(`app-tile-${module.id}`)).toBeInTheDocument();
      });
    });
  });

  it('loading state has role="status" and aria-busy="true"', () => {
    mockGetVisibleModules.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        }),
    );

    renderWithQueryClient(<HomePageGrid />);

    const statusEl = screen.getByRole('status');
    expect(statusEl).toHaveAttribute('aria-busy', 'true');
    expect(statusEl).toHaveAttribute('aria-label', 'Loading modules');
  });

  it('shows error notification when module loading fails', async () => {
    mockGetVisibleModules.mockRejectedValue(new Error('Network error'));

    renderWithQueryClient(<HomePageGrid />);

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

    const { container } = renderWithQueryClient(<HomePageGrid />);

    await waitFor(() => {
      expect(screen.getByTestId('app-tile-clinical')).toBeInTheDocument();
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
