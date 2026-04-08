import { render, screen } from '@testing-library/react';
import { ImmunizationInputEntry } from '../../../../models/immunization';
import SelectedImmunizationItem, {
  SelectedImmunizationItemProps,
} from '../SelectedImmunizationItem';

jest.mock('../styles/SelectedImmunizationItem.module.scss', () => ({
  vaccineTitle: 'vaccineTitle',
  requiredMark: 'requiredMark',
  datePickerFullWidth: 'datePickerFullWidth',
}));

jest.mock('../ImmunizationDetailsForm', () => {
  const MockDetailsForm = (props: { entry: { id: string } }) => (
    <div data-testid={`mock-details-form-${props.entry.id}`} />
  );
  MockDetailsForm.displayName = 'MockImmunizationDetailsForm';
  return MockDetailsForm;
});

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

const createDefaultProps = (
  overrides?: Partial<SelectedImmunizationItemProps>,
): SelectedImmunizationItemProps => ({
  entry: createMockEntry(),
  fieldConfig: { administeredOn: 'required', notes: 'visible' },
  vaccineConceptUuid: 'vaccine-uuid-1',
  vaccinationsBundle: { resourceType: 'Bundle', type: 'searchset' },
  routeItems: [],
  siteItems: [],
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

describe('SelectedImmunizationItem', () => {
  test('renders vaccine display name', () => {
    render(<SelectedImmunizationItem {...createDefaultProps()} />);

    expect(screen.getByText('BCG Vaccine')).toBeInTheDocument();
    expect(screen.getByTestId('immunization-name-entry-1')).toBeInTheDocument();
  });

  test('renders ImmunizationDetailsForm', () => {
    render(<SelectedImmunizationItem {...createDefaultProps()} />);

    expect(screen.getByTestId('mock-details-form-entry-1')).toBeInTheDocument();
  });

  test('passes statusReasonItems and updateStatusReason when provided', () => {
    const updateStatusReason = jest.fn();
    const statusReasonItems = [{ uuid: 'reason-1', name: 'Patient Refused' }];

    render(
      <SelectedImmunizationItem
        {...createDefaultProps({
          statusReasonItems,
          updateStatusReason,
        })}
      />,
    );

    expect(screen.getByTestId('mock-details-form-entry-1')).toBeInTheDocument();
  });

  test('renders different vaccine names based on entry', () => {
    const entry = createMockEntry({
      id: 'entry-2',
      vaccineDisplay: 'COVID-19 Vaccine',
    });

    render(<SelectedImmunizationItem {...createDefaultProps({ entry })} />);

    expect(screen.getByText('COVID-19 Vaccine')).toBeInTheDocument();
    expect(screen.getByTestId('immunization-name-entry-2')).toBeInTheDocument();
  });
});
