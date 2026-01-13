import { getConfig } from '@bahmni/services';
import { NotificationProvider } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { ClinicalConfigProvider } from '../index';
import { ClinicalConfig } from '../models';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getConfig: jest.fn(),
}));
const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;

const mockClinicalConfig: ClinicalConfig = {
  patientInformation: {},
  actions: [],
  dashboards: [
    {
      name: 'Dashboard 1',
      url: '/dashboard1',
      requiredPrivileges: ['privilege1'],
      icon: 'icon1',
      default: true,
    },
  ],
  consultationPad: {
    allergyConceptMap: {
      medicationAllergenUuid: 'med-uuid',
      foodAllergenUuid: 'food-uuid',
      environmentalAllergenUuid: 'env-uuid',
      allergyReactionUuid: 'reaction-uuid',
    },
  },
};

const TestComponent = () => <div data-testid="test-child">Test Child</div>;

describe('ClinicalConfigProvider', () => {
  let queryClient: QueryClient;

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>
      <QueryClientProvider client={queryClient}>
        <ClinicalConfigProvider>{children}</ClinicalConfigProvider>
      </QueryClientProvider>
    </NotificationProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    jest.clearAllMocks();
  });

  afterEach(async () => {
    queryClient.clear();
    await queryClient.cancelQueries();
  });

  it('should render children when clinical config is loaded', async () => {
    mockGetConfig.mockResolvedValueOnce(mockClinicalConfig);

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    expect(mockGetConfig).toHaveBeenCalled();
  });

  it('should show loading state when clinical config is being fetched', async () => {
    mockGetConfig.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(mockClinicalConfig), 100),
        ),
    );

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>,
    );

    expect(
      screen.getByTestId('clinical-config-loader-test-id'),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
  });

  it('should show error notification and empty screen when there is an error fetching clinical config', async () => {
    const mockError = new Error('Failed to fetch clinical config');
    mockGetConfig.mockRejectedValueOnce(mockError);

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('clinical-config-error-test-id'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('Failed to fetch clinical config'),
      ).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId('test-child')).not.toBeInTheDocument();
  });
});
