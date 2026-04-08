import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Bundle, Medication } from 'fhir/r4';
import {
  ImmunizationInputEntry,
  FieldConfig,
} from '../../../../models/immunization';
import ImmunizationDetailsForm, {
  ImmunizationDetailsFormProps,
} from '../ImmunizationDetailsForm';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getTodayDate: () => new Date().toISOString().split('T')[0],
}));

jest.mock('../styles/SelectedImmunizationItem.module.scss', () => ({
  vaccineTitle: 'vaccineTitle',
  requiredMark: 'requiredMark',
  datePickerFullWidth: 'datePickerFullWidth',
}));

jest.mock('../../../../hooks/useLocations', () => ({
  useLocations: () => ({
    locations: [
      { uuid: 'loc-1', display: 'Main Hospital' },
      { uuid: 'loc-2', display: 'Branch Clinic' },
    ],
    loading: false,
    error: null,
  }),
}));

jest.mock('../../../../services/medicationService', () => ({
  getMedicationDisplay: (med: Medication) => med.code?.text ?? 'Unknown Drug',
}));

const createMockEntry = (
  overrides?: Partial<ImmunizationInputEntry>,
): ImmunizationInputEntry => ({
  id: 'entry-1',
  vaccineConceptUuid: 'vaccine-uuid-1',
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
  ...overrides,
});

const createMockBundle = (
  medications: Medication[] = [],
): Bundle<Medication> => ({
  resourceType: 'Bundle',
  type: 'searchset',
  entry: medications.map((m) => ({ resource: m })),
});

const HISTORY_FIELD_CONFIG: FieldConfig = {
  doseSequence: 'visible',
  drug: 'visible',
  administeredOn: 'required',
  location: 'visible',
  route: 'visible',
  site: 'visible',
  manufacturer: 'visible',
  batchNumber: 'visible',
  expirationDate: 'visible',
  notes: 'visible',
};

const NOT_DONE_FIELD_CONFIG: FieldConfig = {
  statusReason: 'required',
  notes: 'visible',
};

const createDefaultProps = (
  overrides?: Partial<ImmunizationDetailsFormProps>,
): ImmunizationDetailsFormProps => ({
  entry: createMockEntry(),
  fieldConfig: HISTORY_FIELD_CONFIG,
  vaccineConceptUuid: 'vaccine-uuid-1',
  vaccinationsBundle: createMockBundle(),
  routeItems: [
    { uuid: 'route-1', name: 'Intramuscular' },
    { uuid: 'route-2', name: 'Subcutaneous' },
  ],
  siteItems: [
    { uuid: 'site-1', name: 'Left Arm' },
    { uuid: 'site-2', name: 'Right Arm' },
  ],
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
  ...overrides,
});

describe('ImmunizationDetailsForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('field visibility based on config', () => {
    test('renders all fields for history mode config', () => {
      render(<ImmunizationDetailsForm {...createDefaultProps()} />);

      expect(
        screen.getByTestId('immunization-fields-form-grid-entry-1'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('immunization-dose-sequence-entry-1'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('immunization-drug-search-entry-1'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('immunization-date-input-entry-1'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('immunization-manufacturer-entry-1'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('immunization-batch-number-entry-1'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('immunization-site-entry-1'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('immunization-route-entry-1'),
      ).toBeInTheDocument();
    });

    test('renders only statusReason and notes for not-done config', () => {
      const updateStatusReason = jest.fn();

      render(
        <ImmunizationDetailsForm
          {...createDefaultProps({
            fieldConfig: NOT_DONE_FIELD_CONFIG,
            statusReasonItems: [{ uuid: 'reason-1', name: 'Patient Refused' }],
            updateStatusReason,
          })}
        />,
      );

      expect(
        screen.getByTestId('immunization-status-reason-entry-1'),
      ).toBeInTheDocument();

      // Fields not in not-done config should be absent
      expect(
        screen.queryByTestId('immunization-dose-sequence-entry-1'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('immunization-drug-search-entry-1'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('immunization-date-input-entry-1'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('immunization-manufacturer-entry-1'),
      ).not.toBeInTheDocument();
    });

    test('hides fields set to hidden in config', () => {
      render(
        <ImmunizationDetailsForm
          {...createDefaultProps({
            fieldConfig: {
              administeredOn: 'required',
              manufacturer: 'hidden',
              batchNumber: 'hidden',
            },
          })}
        />,
      );

      expect(
        screen.getByTestId('immunization-date-input-entry-1'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('immunization-manufacturer-entry-1'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('immunization-batch-number-entry-1'),
      ).not.toBeInTheDocument();
    });
  });

  describe('text input interactions', () => {
    test('calls updateManufacturer on input change', async () => {
      const user = userEvent.setup();
      const updateManufacturer = jest.fn();

      render(
        <ImmunizationDetailsForm
          {...createDefaultProps({ updateManufacturer })}
        />,
      );

      const input = screen.getByTestId('immunization-manufacturer-entry-1');
      await user.type(input, 'Pfizer');

      expect(updateManufacturer).toHaveBeenCalled();
      expect(updateManufacturer.mock.calls[0][0]).toBe('entry-1');
    });

    test('calls updateBatchNumber on input change', async () => {
      const user = userEvent.setup();
      const updateBatchNumber = jest.fn();

      render(
        <ImmunizationDetailsForm
          {...createDefaultProps({ updateBatchNumber })}
        />,
      );

      const input = screen.getByTestId('immunization-batch-number-entry-1');
      await user.type(input, 'BATCH123');

      expect(updateBatchNumber).toHaveBeenCalled();
      expect(updateBatchNumber.mock.calls[0][0]).toBe('entry-1');
    });
  });

  describe('notes section', () => {
    test('shows "Add Note" link when notes field is visible and entry has no notes', () => {
      render(<ImmunizationDetailsForm {...createDefaultProps()} />);

      expect(
        screen.getByTestId('immunization-add-note-link-entry-1'),
      ).toBeInTheDocument();
    });

    test('shows note textarea when entry already has notes', () => {
      const entry = createMockEntry({ notes: 'Existing note text' });

      render(<ImmunizationDetailsForm {...createDefaultProps({ entry })} />);

      expect(
        screen.getByTestId('immunization-note-entry-1'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('immunization-add-note-link-entry-1'),
      ).not.toBeInTheDocument();
    });

    test('shows textarea after clicking "Add Note" link', async () => {
      const user = userEvent.setup();

      render(<ImmunizationDetailsForm {...createDefaultProps()} />);

      await user.click(
        screen.getByTestId('immunization-add-note-link-entry-1'),
      );

      expect(
        screen.getByTestId('immunization-note-entry-1'),
      ).toBeInTheDocument();
    });

    test('hides notes section when notes field is hidden', () => {
      render(
        <ImmunizationDetailsForm
          {...createDefaultProps({
            fieldConfig: { administeredOn: 'required' },
          })}
        />,
      );

      expect(
        screen.queryByTestId('immunization-add-note-link-entry-1'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('immunization-note-entry-1'),
      ).not.toBeInTheDocument();
    });
  });

  describe('drug field', () => {
    test('renders drug combobox by default', () => {
      render(<ImmunizationDetailsForm {...createDefaultProps()} />);

      expect(
        screen.getByTestId('immunization-drug-search-entry-1'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('immunization-drug-non-coded-entry-1'),
      ).not.toBeInTheDocument();
    });

    test('renders manual text input when entry has drugNonCoded', () => {
      const entry = createMockEntry({ drugNonCoded: 'Custom Drug Name' });

      render(<ImmunizationDetailsForm {...createDefaultProps({ entry })} />);

      expect(
        screen.getByTestId('immunization-drug-non-coded-entry-1'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('immunization-drug-search-entry-1'),
      ).not.toBeInTheDocument();
    });

    test('shows "Back to list" link in manual drug mode', () => {
      const entry = createMockEntry({ drugNonCoded: 'Custom Drug' });

      render(<ImmunizationDetailsForm {...createDefaultProps({ entry })} />);

      expect(
        screen.getByTestId('immunization-drug-back-to-list-entry-1'),
      ).toBeInTheDocument();
    });

    test('switches back to combobox when "Back to list" is clicked', async () => {
      const user = userEvent.setup();
      const updateDrugNonCoded = jest.fn();
      const entry = createMockEntry({ drugNonCoded: 'Custom Drug' });

      render(
        <ImmunizationDetailsForm
          {...createDefaultProps({ entry, updateDrugNonCoded })}
        />,
      );

      await user.click(
        screen.getByTestId('immunization-drug-back-to-list-entry-1'),
      );

      expect(
        screen.getByTestId('immunization-drug-search-entry-1'),
      ).toBeInTheDocument();
      expect(updateDrugNonCoded).toHaveBeenCalledWith('entry-1', '');
    });
  });

  describe('location field', () => {
    test('renders location combobox by default', () => {
      render(<ImmunizationDetailsForm {...createDefaultProps()} />);

      expect(
        screen.getByTestId('immunization-location-entry-1'),
      ).toBeInTheDocument();
    });

    test('renders manual text input when entry has locationText', () => {
      const entry = createMockEntry({ locationText: 'Home Visit' });

      render(<ImmunizationDetailsForm {...createDefaultProps({ entry })} />);

      expect(
        screen.getByTestId('immunization-location-text-entry-1'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('immunization-location-entry-1'),
      ).not.toBeInTheDocument();
    });

    test('switches back to combobox when "Back to list" is clicked for location', async () => {
      const user = userEvent.setup();
      const updateLocationText = jest.fn();
      const entry = createMockEntry({ locationText: 'Custom Location' });

      render(
        <ImmunizationDetailsForm
          {...createDefaultProps({ entry, updateLocationText })}
        />,
      );

      await user.click(
        screen.getByTestId('immunization-location-back-to-list-entry-1'),
      );

      expect(
        screen.getByTestId('immunization-location-entry-1'),
      ).toBeInTheDocument();
      expect(updateLocationText).toHaveBeenCalledWith('entry-1', '');
    });
  });

  describe('error display', () => {
    test('renders fields with error state when entry has errors', () => {
      const entry = createMockEntry({
        errors: {
          manufacturer: 'INPUT_VALUE_REQUIRED',
          batchNumber: 'INPUT_VALUE_REQUIRED',
        },
      });

      render(<ImmunizationDetailsForm {...createDefaultProps({ entry })} />);

      // TextInput components propagate invalid as aria-invalid on the input
      const manufacturerInput = screen.getByTestId(
        'immunization-manufacturer-entry-1',
      );
      expect(manufacturerInput).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('readonly fields', () => {
    test('disables fields set to readonly', () => {
      render(
        <ImmunizationDetailsForm
          {...createDefaultProps({
            fieldConfig: {
              ...HISTORY_FIELD_CONFIG,
              manufacturer: 'readonly',
              batchNumber: 'readonly',
            },
          })}
        />,
      );

      expect(
        screen.getByTestId('immunization-manufacturer-entry-1'),
      ).toBeDisabled();
      expect(
        screen.getByTestId('immunization-batch-number-entry-1'),
      ).toBeDisabled();
    });
  });
});
