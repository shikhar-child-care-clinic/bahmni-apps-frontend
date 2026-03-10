import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { render, screen, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { mockAppointmentServices } from '../__mocks__/mocks';
import AllServicesPage from '../index';

expect.extend(toHaveNoViolations);

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

describe('AllServicesPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = (
    <QueryClientProvider client={queryClient}>
      <AllServicesPage />
    </QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it.each([
    {
      scenario: 'loading state while services are being fetched',
      mockValues: { data: null, isError: false, isLoading: true },
      expectedTestId: 'all-services-sortable-data-table-test-id-skeleton',
      expectedTexts: [],
    },
    {
      scenario: 'error state when fetching services fails',
      mockValues: { data: null, isError: true, isLoading: false },
      expectedTestId: 'all-services-sortable-data-table-test-id-error',
      expectedTexts: ['Failed to load services. Please try again.'],
    },
    {
      scenario: 'empty state when no services exist',
      mockValues: { data: [], isError: false, isLoading: false },
      expectedTestId: 'all-services-sortable-data-table-test-id-empty',
      expectedTexts: ['No services found.'],
    },
  ])(
    'should show $scenario',
    ({ mockValues, expectedTestId, expectedTexts }) => {
      (useQuery as jest.Mock).mockReturnValue(mockValues);
      render(wrapper);
      expect(
        screen.getByTestId('all-services-action-data-table-test-id'),
      ).toBeInTheDocument();
      expect(screen.getByTestId(expectedTestId)).toBeInTheDocument();
      expectedTexts.forEach((text) =>
        expect(screen.getByText(text)).toBeInTheDocument(),
      );
    },
  );

  it('should render all services in the table', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: mockAppointmentServices,
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    expect(
      screen.getByTestId('all-services-sortable-data-table-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('General Medicine OPD Consultation'),
    ).toBeInTheDocument();
    expect(screen.getByText('ENT OPD Consultation')).toBeInTheDocument();
    expect(screen.getByText('General Consultation')).toBeInTheDocument();
    expect(screen.getByText('General OPD')).toBeInTheDocument();
    expect(screen.getByText('General Medicine')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('should render missing data gracefully', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [mockAppointmentServices[2]],
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    const rowId = mockAppointmentServices[2].uuid;
    ['location', 'speciality', 'durationMins', 'description'].forEach(
      (field) => {
        expect(
          screen.getByTestId(`table-cell-${rowId}-${field}`),
        ).toHaveTextContent('-');
      },
    );
  });

  describe('Snapshot', () => {
    it('should match snapshot with services data', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: mockAppointmentServices,
        isError: false,
        isLoading: false,
      });
      const { container } = render(wrapper);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it('passes accessibility tests with services data', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: mockAppointmentServices,
        isError: false,
        isLoading: false,
      });
      const { container } = render(wrapper);
      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });
});
