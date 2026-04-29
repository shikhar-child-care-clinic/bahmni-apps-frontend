import { useTranslation } from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import usePatientSearch from '../../../hooks/usePatientSearch';
import { useClinicalConfig } from '../../../providers/clinicalConfig';
import PatientSearch from '../PatientSearch';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

Element.prototype.scrollIntoView = jest.fn();

const mockNavigate = jest.fn();
const mockAddNotification = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useNotification: jest.fn(),
}));

jest.mock('../../../hooks/usePatientSearch');
jest.mock('../../../providers/clinicalConfig');

const mockedUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;
const mockedUsePatientSearch = usePatientSearch as jest.MockedFunction<
  typeof usePatientSearch
>;
const mockedUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;
const mockedUseClinicalConfig = useClinicalConfig as jest.MockedFunction<
  typeof useClinicalConfig
>;

const mockTranslate = jest.fn((key: string) => {
  const translations: Record<string, string> = {
    SEARCH_PATIENT_ID_PLACEHOLDER: 'Search by Patient ID',
    NO_MATCHING_RECORDS: 'No matching records',
  };
  return translations[key] || key;
});

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
};

const mockPatient = {
  uuid: 'patient-uuid-1',
  givenName: 'John',
  familyName: 'Doe',
  identifier: 'GAN123456',
  birthDate: '1990-01-01',
  gender: 'M',
  extraIdentifiers: null,
  personId: 1,
  deathDate: null,
  addressFieldValue: null,
  patientProgramAttributeValue: null,
  middleName: '',
  dateCreated: new Date(),
  activeVisitUuid: '',
  customAttribute: '',
  hasBeenAdmitted: false,
  age: '34',
};

describe('PatientSearch Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTranslation.mockReturnValue({ t: mockTranslate } as any);
    mockedUseNotification.mockReturnValue({
      addNotification: mockAddNotification,
    } as any);
    mockedUsePatientSearch.mockReturnValue({
      results: [],
      isLoading: false,
      isError: false,
      error: null,
    });
    mockedUseClinicalConfig.mockReturnValue({
      clinicalConfig: null,
      isLoading: false,
      error: null,
    });
  });

  describe('Rendering', () => {
    test('renders nothing when isOpen is false', () => {
      const { container } = render(
        <PatientSearch isOpen={false} onClose={jest.fn()} />,
      );
      expect(container.firstChild).toBeNull();
    });

    test('renders combobox when isOpen is true', () => {
      render(<PatientSearch {...defaultProps} />);
      expect(
        screen.getByTestId('patient-search-container'),
      ).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    test('shows placeholder text from translation key', () => {
      render(<PatientSearch {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search by Patient ID');
      expect(input).toBeInTheDocument();
    });

    test('does not show dropdown when typing without pressing Enter', async () => {
      mockedUsePatientSearch.mockReturnValue({
        results: [mockPatient],
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<PatientSearch {...defaultProps} />);
      const combobox = screen.getByRole('combobox');
      await userEvent.type(combobox, 'GAN');

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  describe('Functionality', () => {
    test('shows results with name and identifier after pressing Enter', async () => {
      mockedUsePatientSearch.mockReturnValue({
        results: [mockPatient],
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<PatientSearch {...defaultProps} />);
      const combobox = screen.getByRole('combobox');
      await userEvent.type(combobox, 'GAN123456');
      fireEvent.keyDown(screen.getByTestId('patient-search-container'), {
        key: 'Enter',
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('GAN123456')).toBeInTheDocument();
      });
    });

    test('navigates to patient dashboard on selecting a result', async () => {
      mockedUsePatientSearch.mockReturnValue({
        results: [mockPatient],
        isLoading: false,
        isError: false,
        error: null,
      });

      const onClose = jest.fn();
      render(<PatientSearch isOpen onClose={onClose} />);
      const combobox = screen.getByRole('combobox');
      await userEvent.type(combobox, 'GAN123456');
      fireEvent.keyDown(screen.getByTestId('patient-search-container'), {
        key: 'Enter',
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('John Doe'));

      expect(mockNavigate).toHaveBeenCalledWith(`../${mockPatient.uuid}`);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('clears results when input is cleared', async () => {
      mockedUsePatientSearch.mockReturnValue({
        results: [mockPatient],
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<PatientSearch {...defaultProps} />);
      const combobox = screen.getByRole('combobox');
      await userEvent.type(combobox, 'GAN123456');
      fireEvent.keyDown(screen.getByTestId('patient-search-container'), {
        key: 'Enter',
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      await userEvent.clear(combobox);

      await waitFor(() => {
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });

    test('calls onClose when pressing Escape key', () => {
      const onClose = jest.fn();
      render(<PatientSearch isOpen onClose={onClose} />);

      fireEvent.keyDown(screen.getByTestId('patient-search-container'), {
        key: 'Escape',
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('calls onClose when clicking outside the component', () => {
      const onClose = jest.fn();
      render(
        <div>
          <PatientSearch isOpen onClose={onClose} />
          <div data-testid="outside-element">Outside</div>
        </div>,
      );

      fireEvent.mouseDown(screen.getByTestId('outside-element'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Configurable display fields', () => {
    test('uses default display fields when config is not provided', async () => {
      mockedUsePatientSearch.mockReturnValue({
        results: [mockPatient],
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<PatientSearch {...defaultProps} />);
      const combobox = screen.getByRole('combobox');
      await userEvent.type(combobox, 'GAN123456');
      fireEvent.keyDown(screen.getByTestId('patient-search-container'), {
        key: 'Enter',
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('GAN123456')).toBeInTheDocument();
      });
    });

    test('renders custom display fields from config', async () => {
      mockedUseClinicalConfig.mockReturnValue({
        clinicalConfig: {
          patientSearch: {
            displayFields: [
              { field: 'name', bold: true },
              { field: 'identifier' },
              { field: 'gender' },
              { field: 'age' },
            ],
          },
        } as any,
        isLoading: false,
        error: null,
      });

      mockedUsePatientSearch.mockReturnValue({
        results: [mockPatient],
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<PatientSearch {...defaultProps} />);
      const combobox = screen.getByRole('combobox');
      await userEvent.type(combobox, 'GAN123456');
      fireEvent.keyDown(screen.getByTestId('patient-search-container'), {
        key: 'Enter',
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('GAN123456')).toBeInTheDocument();
        expect(screen.getByText('M')).toBeInTheDocument();
        expect(screen.getByText('34')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('combobox has proper aria-label', () => {
      render(<PatientSearch {...defaultProps} />);
      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveAttribute('aria-label', 'Search by Patient ID');
    });

    test('has no accessibility violations when open', async () => {
      const { container } = render(<PatientSearch {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('combobox expands when results are shown after Enter', async () => {
      mockedUsePatientSearch.mockReturnValue({
        results: [mockPatient],
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<PatientSearch {...defaultProps} />);
      const combobox = screen.getByRole('combobox');
      await userEvent.type(combobox, 'GAN123456');
      fireEvent.keyDown(screen.getByTestId('patient-search-container'), {
        key: 'Enter',
      });

      await waitFor(() => {
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });
});
