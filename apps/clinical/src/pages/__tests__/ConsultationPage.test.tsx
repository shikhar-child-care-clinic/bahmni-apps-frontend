import { getConfig } from '@bahmni/services';
import { useNotification, useUserPrivilege } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import { useClinicalConfig } from '../../providers/clinicConfig';
import ConsultationPage from '../ConsultationPage';

expect.extend(toHaveNoViolations);

jest.mock('../../providers/clinicConfig', () => ({
  ...jest.requireActual('../../providers/clinicConfig'),
  useClinicalConfig: jest.fn(),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useUserPrivilege: jest.fn(),
  useNotification: jest.fn(),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getConfig: jest.fn(),
}));

const mockClinicalConfig = {
  patientInformation: {},
  actions: [],
  dashboards: [
    {
      name: 'General',
      url: '/config/dashboard.json',
      requiredPrivileges: [],
      default: true,
    },
  ],
  consultationPad: {
    allergyConceptMap: {
      medicationAllergenUuid: 'uuid-1',
      foodAllergenUuid: 'uuid-2',
      environmentalAllergenUuid: 'uuid-3',
      allergyReactionUuid: 'uuid-4',
    },
  },
};

const mockDashboardConfig = {
  sections: [
    {
      id: 'vitals',
      name: 'Vitals',
      icon: 'fa-heartbeat',
      translationKey: 'VITALS_SECTION',
      controls: [],
    },
  ],
};

const renderWithProvider = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/consultation?episodeUuid=test-episode']}>
        <ConsultationPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('ConsultationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(useClinicalConfig).mockReturnValue({
      clinicalConfig: mockClinicalConfig,
      isLoading: false,
      error: null,
    });

    jest.mocked(useUserPrivilege).mockReturnValue({
      userPrivileges: ['VIEW_PATIENTS', 'EDIT_ENCOUNTERS'],
    });

    jest.mocked(useNotification).mockReturnValue({
      addNotification: jest.fn(),
    });

    jest.mocked(getConfig).mockResolvedValue(mockDashboardConfig);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering and Structure', () => {
    it('should render the ConsultationPage component', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(
          screen.queryByText('LOADING_CLINICAL_CONFIG'),
        ).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(
          screen.queryByText('LOADING_DASHBOARD_CONFIG'),
        ).not.toBeInTheDocument();
      });
    });

    it('should handle the loading state', () => {
      jest.mocked(useClinicalConfig).mockReturnValue({
        clinicalConfig: null,
        isLoading: true,
        error: null,
      });

      renderWithProvider();

      expect(
        screen.getByText('Loading clinical configuration...'),
      ).toBeInTheDocument();
    });

    it('should show loading when user privileges are not available', () => {
      jest.mocked(useUserPrivilege).mockReturnValue({
        userPrivileges: null,
      });

      renderWithProvider();

      expect(
        screen.getByText('Loading user privileges...'),
      ).toBeInTheDocument();
    });

    it('should show error when no default dashboard is available', () => {
      const mockAddNotification = jest.fn();
      jest.mocked(useNotification).mockReturnValue({
        addNotification: mockAddNotification,
      });

      jest.mocked(useClinicalConfig).mockReturnValue({
        clinicalConfig: {
          ...mockClinicalConfig,
          dashboards: [],
        },
        isLoading: false,
        error: null,
      });

      renderWithProvider();

      expect(
        screen.getByTestId('error-no-default-dashboard-test-id'),
      ).toBeInTheDocument();
      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'Error',
        message: 'No default dashboard configured',
        type: 'error',
      });
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProvider();

      await waitFor(() => {
        expect(
          screen.queryByText('LOADING_CLINICAL_CONFIG'),
        ).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(
          screen.queryByText('LOADING_DASHBOARD_CONFIG'),
        ).not.toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Snapshot', () => {
    it('should match the snapshot', async () => {
      const { asFragment } = renderWithProvider();

      await waitFor(() => {
        expect(
          screen.queryByText('LOADING_CLINICAL_CONFIG'),
        ).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(
          screen.queryByText('LOADING_DASHBOARD_CONFIG'),
        ).not.toBeInTheDocument();
      });

      expect(asFragment()).toMatchSnapshot();
    });
  });
});
