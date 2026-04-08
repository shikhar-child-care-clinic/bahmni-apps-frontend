import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { useImmunizationStore } from '../../../../stores/immunizationStore';
import ImmunizationForm from '../ImmunizationForm';

Element.prototype.scrollIntoView = jest.fn();

jest.mock('../styles/ImmunizationForm.module.scss', () => ({
  immunizationFormTile: 'immunizationFormTile',
  immunizationFormTitle: 'immunizationFormTitle',
  immunizationBox: 'immunizationBox',
  selectedImmunizationItem: 'selectedImmunizationItem',
}));

jest.mock('../styles/SelectedImmunizationItem.module.scss', () => ({
  vaccineTitle: 'vaccineTitle',
  requiredMark: 'requiredMark',
  datePickerFullWidth: 'datePickerFullWidth',
}));

jest.mock('../SelectedImmunizationItem', () => {
  const MockSelectedItem = (props: { entry: { id: string; vaccineDisplay: string } }) => (
    <div data-testid={`mock-selected-immunization-${props.entry.id}`}>
      {props.entry.vaccineDisplay}
    </div>
  );
  MockSelectedItem.displayName = 'MockSelectedImmunizationItem';
  return MockSelectedItem;
});

jest.mock('../../../../stores/immunizationStore');

jest.mock('../../../../hooks/useLocations', () => ({
  useLocations: () => ({
    locations: [],
    loading: false,
    error: null,
  }),
}));

jest.mock('../../../../services/medicationService', () => ({
  getMedicationDisplay: () => 'Mock Drug',
}));

const mockClinicalConfig = {
  clinicalConfig: {
    consultationPad: {
      immunizationForm: {
        vaccineConceptSetUuid: 'vaccine-concept-set-uuid',
        routeConceptSetUuid: 'route-concept-set-uuid',
        siteConceptSetUuid: 'site-concept-set-uuid',
        notDoneStatusReasonConceptSetUuid: 'status-reason-uuid',
        history: { fieldConfig: {} },
        notDone: { fieldConfig: {} },
        administration: { fieldConfig: {} },
      },
    },
  },
  isLoading: false,
};

jest.mock('../../../../providers/clinicalConfig', () => ({
  useClinicalConfig: () => mockClinicalConfig,
}));

jest.mock('@bahmni/services', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  getVaccinations: jest.fn().mockResolvedValue({
    resourceType: 'Bundle',
    type: 'searchset',
    entry: [],
  }),
  searchFHIRConcepts: jest.fn().mockResolvedValue({
    expansion: {
      contains: [
        { code: 'bcg-uuid', display: 'BCG Vaccine' },
        { code: 'opv-uuid', display: 'OPV Vaccine' },
        { code: 'hep-b-uuid', display: 'Hepatitis B' },
      ],
    },
  }),
}));

jest.mock('@bahmni/widgets', () => ({
  usePatientUUID: () => 'mock-patient-uuid',
}));

jest.mock('@bahmni/design-system', () => ({
  ...jest.requireActual('@bahmni/design-system'),
  BoxWHeader: ({ children, title }: any) => (
    <div data-testid="box-w-header">
      <span>{title}</span>
      {children}
    </div>
  ),
  SelectedItem: ({ children, onClose }: any) => (
    <div data-testid="selected-item">
      {children}
      <button onClick={onClose} aria-label="Remove">
        x
      </button>
    </div>
  ),
}));

const mockStoreState = {
  selectedImmunizations: [],
  addImmunization: jest.fn(),
  removeImmunization: jest.fn(),
  updateDoseSequence: jest.fn(),
  updateDrug: jest.fn(),
  updateDrugNonCoded: jest.fn(),
  updateAdministeredOn: jest.fn(),
  updateLocation: jest.fn(),
  updateLocationText: jest.fn(),
  updateRoute: jest.fn(),
  updateSite: jest.fn(),
  updateManufacturer: jest.fn(),
  updateBatchNumber: jest.fn(),
  updateExpirationDate: jest.fn(),
  updateNotes: jest.fn(),
  updateStatusReason: jest.fn(),
};

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

describe('ImmunizationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useImmunizationStore as unknown as jest.Mock).mockReturnValue(
      mockStoreState,
    );
  });

  describe('rendering', () => {
    test('renders form tile with title', () => {
      renderWithProviders(
        <ImmunizationForm mode="history" titleKey="IMMUNIZATION_HISTORY" />,
      );

      expect(
        screen.getByTestId('immunization-form-tile-history'),
      ).toBeInTheDocument();
      expect(screen.getByText('IMMUNIZATION_HISTORY')).toBeInTheDocument();
    });

    test('renders search combobox', async () => {
      renderWithProviders(
        <ImmunizationForm mode="history" titleKey="IMMUNIZATION_HISTORY" />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('immunization-search-combobox-history'),
        ).toBeInTheDocument();
      });
    });

    test('renders error when immunization config is missing', () => {
      mockClinicalConfig.clinicalConfig = {
        consultationPad: {},
      } as any;

      renderWithProviders(
        <ImmunizationForm mode="history" titleKey="IMMUNIZATION_HISTORY" />,
      );

      expect(screen.getByText('IMMUNIZATION_CONFIG_MISSING')).toBeInTheDocument();

      // Restore config
      mockClinicalConfig.clinicalConfig = {
        consultationPad: {
          immunizationForm: {
            vaccineConceptSetUuid: 'vaccine-concept-set-uuid',
            routeConceptSetUuid: 'route-concept-set-uuid',
            siteConceptSetUuid: 'site-concept-set-uuid',
            notDoneStatusReasonConceptSetUuid: 'status-reason-uuid',
            history: { fieldConfig: {} },
            notDone: { fieldConfig: {} },
            administration: { fieldConfig: {} },
          },
        },
      } as any;
    });

    test('shows skeleton loader while config is loading', () => {
      mockClinicalConfig.isLoading = true;

      renderWithProviders(
        <ImmunizationForm mode="history" titleKey="IMMUNIZATION_HISTORY" />,
      );

      // Should not show error, and should not show combobox
      expect(
        screen.queryByText('IMMUNIZATION_CONFIG_MISSING'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('immunization-search-combobox-history'),
      ).not.toBeInTheDocument();

      mockClinicalConfig.isLoading = false;
    });
  });

  describe('vaccine search and selection', () => {
    test('calls addImmunization when a vaccine is selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ImmunizationForm mode="history" titleKey="IMMUNIZATION_HISTORY" />,
      );

      const combobox = await screen.findByRole('combobox');
      await user.type(combobox, 'BCG');

      await waitFor(() => {
        expect(screen.getByText('BCG Vaccine')).toBeInTheDocument();
      });

      await user.click(screen.getByText('BCG Vaccine'));

      expect(mockStoreState.addImmunization).toHaveBeenCalledWith(
        'bcg-uuid',
        'BCG Vaccine',
        'history',
      );
    });
  });

  describe('selected immunizations display', () => {
    test('renders selected immunizations for the current mode', async () => {
      (useImmunizationStore as unknown as jest.Mock).mockReturnValue({
        ...mockStoreState,
        selectedImmunizations: [
          {
            id: 'entry-1',
            vaccineConceptUuid: 'bcg-uuid',
            vaccineDisplay: 'BCG Vaccine',
            mode: 'history',
            status: 'completed',
            drugUuid: null,
            drugDisplay: null,
            drugNonCoded: '',
            doseSequence: null,
            administeredOn: null,
            locationUuid: null,
            locationDisplay: null,
            locationText: '',
            routeConceptUuid: null,
            routeDisplay: null,
            siteConceptUuid: null,
            siteDisplay: null,
            manufacturer: '',
            batchNumber: '',
            expirationDate: null,
            notes: '',
            orderUuid: null,
            statusReasonConceptUuid: null,
            statusReasonDisplay: null,
            errors: {},
            hasBeenValidated: false,
          },
        ],
      });

      renderWithProviders(
        <ImmunizationForm mode="history" titleKey="IMMUNIZATION_HISTORY" />,
      );

      await waitFor(() => {
        expect(screen.getByText('BCG Vaccine')).toBeInTheDocument();
      });
    });

    test('does not render immunizations from a different mode', async () => {
      (useImmunizationStore as unknown as jest.Mock).mockReturnValue({
        ...mockStoreState,
        selectedImmunizations: [
          {
            id: 'entry-1',
            vaccineConceptUuid: 'bcg-uuid',
            vaccineDisplay: 'BCG Vaccine',
            mode: 'not-done',
            status: 'not-done',
            drugUuid: null,
            drugDisplay: null,
            drugNonCoded: '',
            doseSequence: null,
            administeredOn: null,
            locationUuid: null,
            locationDisplay: null,
            locationText: '',
            routeConceptUuid: null,
            routeDisplay: null,
            siteConceptUuid: null,
            siteDisplay: null,
            manufacturer: '',
            batchNumber: '',
            expirationDate: null,
            notes: '',
            orderUuid: null,
            statusReasonConceptUuid: null,
            statusReasonDisplay: null,
            errors: {},
            hasBeenValidated: false,
          },
        ],
      });

      renderWithProviders(
        <ImmunizationForm mode="history" titleKey="IMMUNIZATION_HISTORY" />,
      );

      // The selected item box should not appear since the entry mode doesn't match
      expect(screen.queryByTestId('box-w-header')).not.toBeInTheDocument();
    });

    test('calls removeImmunization when remove button is clicked', async () => {
      const user = userEvent.setup();

      (useImmunizationStore as unknown as jest.Mock).mockReturnValue({
        ...mockStoreState,
        selectedImmunizations: [
          {
            id: 'entry-1',
            vaccineConceptUuid: 'bcg-uuid',
            vaccineDisplay: 'BCG Vaccine',
            mode: 'history',
            status: 'completed',
            drugUuid: null,
            drugDisplay: null,
            drugNonCoded: '',
            doseSequence: null,
            administeredOn: null,
            locationUuid: null,
            locationDisplay: null,
            locationText: '',
            routeConceptUuid: null,
            routeDisplay: null,
            siteConceptUuid: null,
            siteDisplay: null,
            manufacturer: '',
            batchNumber: '',
            expirationDate: null,
            notes: '',
            orderUuid: null,
            statusReasonConceptUuid: null,
            statusReasonDisplay: null,
            errors: {},
            hasBeenValidated: false,
          },
        ],
      });

      renderWithProviders(
        <ImmunizationForm mode="history" titleKey="IMMUNIZATION_HISTORY" />,
      );

      await waitFor(() => {
        expect(screen.getByText('BCG Vaccine')).toBeInTheDocument();
      });

      const removeButton = screen.getByRole('button', { name: /remove/i });
      await user.click(removeButton);

      expect(mockStoreState.removeImmunization).toHaveBeenCalledWith(
        'entry-1',
      );
    });
  });

  describe('mode-specific behavior', () => {
    test('renders with not-done mode', () => {
      renderWithProviders(
        <ImmunizationForm mode="not-done" titleKey="IMMUNIZATION_NOT_DONE" />,
      );

      expect(
        screen.getByTestId('immunization-form-tile-not-done'),
      ).toBeInTheDocument();
    });

    test('renders with administration mode', () => {
      renderWithProviders(
        <ImmunizationForm
          mode="administration"
          titleKey="IMMUNIZATION_ADMINISTRATION"
        />,
      );

      expect(
        screen.getByTestId('immunization-form-tile-administration'),
      ).toBeInTheDocument();
    });
  });
});
