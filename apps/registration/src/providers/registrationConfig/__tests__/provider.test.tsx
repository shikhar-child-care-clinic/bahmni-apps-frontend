import { getConfig } from '@bahmni/services';
import { NotificationProvider } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { RegistrationConfigProvider } from '../index';
import { RegistrationConfig } from '../models';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getConfig: jest.fn(),
}));
const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;

const mockRegistrationConfig: RegistrationConfig = {
  patientSearch: {
    customAttributes: [],
    appointment: [],
  },
  defaultVisitType: 'OPD',
  patientInformation: {
    defaultIdentifierPrefix: 'REG',
    showMiddleName: true,
    showLastName: true,
  },
  fieldValidation: {},
  extensionPoints: [],
  registrationAppExtensions: [],
};

const TestComponent = () => <div data-testid="test-child">Test Child</div>;

describe('RegistrationConfigProvider', () => {
  let queryClient: QueryClient;

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>
      <QueryClientProvider client={queryClient}>
        <RegistrationConfigProvider>{children}</RegistrationConfigProvider>
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

  it('should render children when registration config is loaded', async () => {
    mockGetConfig.mockResolvedValueOnce(mockRegistrationConfig);

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

  it('should show loading state when registration config is being fetched', async () => {
    mockGetConfig.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(mockRegistrationConfig), 100),
        ),
    );

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>,
    );

    expect(
      screen.getByTestId('registration-config-loader-test-id'),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
  });

  it('should show error notification and empty screen when there is an error fetching registration config', async () => {
    const mockError = new Error('Failed to fetch registration config');
    mockGetConfig.mockRejectedValueOnce(mockError);

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('registration-config-error-test-id'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('Failed to fetch registration config'),
      ).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId('test-child')).not.toBeInTheDocument();
  });
});
