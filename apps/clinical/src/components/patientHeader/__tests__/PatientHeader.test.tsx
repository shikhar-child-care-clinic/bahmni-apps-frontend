import { useTranslation } from '@bahmni/services';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import PatientHeader from '../PatientHeader';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
  hasPrivilege: jest.fn((userPrivileges: any[], privilegeName: string) => {
    if (!userPrivileges || userPrivileges.length === 0) return false;
    return userPrivileges.some((p: any) => p.name === privilegeName);
  }),
}));

const mockUseUserPrivilege = jest.fn(() => ({
  userPrivileges: [
    { uuid: 'priv-1', name: 'Add Allergies' },
    { uuid: 'priv-2', name: 'Add Orders' },
    { uuid: 'priv-3', name: 'Add Diagnoses' },
    { uuid: 'priv-4', name: 'Add Medications' },
    { uuid: 'priv-5', name: 'Add Vaccinations' },
  ],
}));

// Mock the PatientDetails component
jest.mock('@bahmni/widgets', () => {
  return {
    __esModule: true,
    PatientDetails: () => (
      <div data-testid="patient-details-mock">PatientDetails Mock</div>
    ),
    useActivePractitioner: jest.fn(() => ({
      uuid: 'active-practitioner-uuid',
      practitioner: { uuid: 'active-practitioner-uuid' },
    })),
    usePatientUUID: jest.fn(() => 'patient-uuid'),
    useUserPrivilege: (...args: any[]) => mockUseUserPrivilege(...args),
  };
});

jest.mock('../../../hooks/useEncounterSession', () => ({
  useEncounterSession: jest.fn(() => ({
    hasActiveSession: false,
    activeEncounter: null,
    isPractitionerMatch: false,
    editActiveEncounter: false,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
}));

const mockedUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

describe('PatientHeader Component', () => {
  // Test props
  const mockSetIsActionAreaVisible = jest.fn();

  // Default props
  const defaultProps = {
    isActionAreaVisible: false,
    setIsActionAreaVisible: mockSetIsActionAreaVisible,
  };

  // Helper function to render with props
  const renderComponent = (props = {}) => {
    return render(<PatientHeader {...defaultProps} {...props} />);
  };
  const mockTranslate = jest.fn((key: string) => {
    const translations: Record<string, string> = {
      CONSULTATION_ACTION_NEW: 'New Consultation',
      CONSULTATION_ACTION_EDIT: 'Edit Consultation',
      CONSULTATION_ACTION_IN_PROGRESS: 'Consultation in progress',
      PATIENT_HEADER_LABEL: 'Patient Header',
    };
    return translations[key] || key;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTranslation.mockReturnValue({ t: mockTranslate } as any);
    // Reset mockUseUserPrivilege to default (all privileges)
    mockUseUserPrivilege.mockImplementation(() => ({
      userPrivileges: [
        { uuid: 'priv-1', name: 'Add Allergies' },
        { uuid: 'priv-2', name: 'Add Orders' },
        { uuid: 'priv-3', name: 'Add Diagnoses' },
        { uuid: 'priv-4', name: 'Add Medications' },
        { uuid: 'priv-5', name: 'Add Vaccinations' },
      ],
    }));
  });

  // Basic rendering tests
  describe('Rendering', () => {
    test('renders without crashing', () => {
      renderComponent();
      expect(screen.getByLabelText('Patient Header')).toBeInTheDocument();
    });

    test('renders Tile with correct aria-label', () => {
      renderComponent();
      const tile = screen.getByLabelText('Patient Header');
      expect(tile).toBeInTheDocument();
    });

    test('renders PatientDetails component', () => {
      renderComponent();
      const patientDetails = screen.getByTestId('patient-details-mock');
      expect(patientDetails).toBeInTheDocument();
    });
  });

  // Button tests
  describe('Button functionality', () => {
    test('renders button with correct text when isActionAreaVisible is false', () => {
      renderComponent({ isActionAreaVisible: false });
      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockSetIsActionAreaVisible).toHaveBeenCalledTimes(1);
      expect(mockSetIsActionAreaVisible).toHaveBeenCalledWith(true);
      expect(button).toHaveTextContent('New Consultation');
    });

    test('renders button with correct text when isActionAreaVisible is true', () => {
      renderComponent({ isActionAreaVisible: true });
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
      expect(button).toHaveTextContent('Consultation in progress');
    });

    test('calls setIsActionAreaVisible with toggled value when button is clicked', () => {
      renderComponent({ isActionAreaVisible: false });
      const button = screen.getByRole('button');

      fireEvent.click(button);

      expect(mockSetIsActionAreaVisible).toHaveBeenCalledTimes(1);
      expect(mockSetIsActionAreaVisible).toHaveBeenCalledWith(true);
    });

    test('setIsActionAreaVisible is not called when action area is already visible', () => {
      renderComponent({ isActionAreaVisible: true });
      const button = screen.getByRole('button');

      fireEvent.click(button);

      expect(mockSetIsActionAreaVisible).toHaveBeenCalledTimes(0);
    });
  });

  // Privilege tests
  describe('Privilege checks', () => {
    test('should not render consultation button when user has no consultation privileges', () => {
      mockUseUserPrivilege.mockReturnValue({
        userPrivileges: [],
      });

      renderComponent();

      expect(
        screen.queryByTestId('consultation-action-button'),
      ).not.toBeInTheDocument();
    });

    test('should render consultation button when user has at least one edit privilege', () => {
      mockUseUserPrivilege.mockReturnValue({
        userPrivileges: [{ uuid: 'priv-1', name: 'Add Allergies' }],
      });

      renderComponent();

      expect(
        screen.getByTestId('consultation-action-button'),
      ).toBeInTheDocument();
    });

    test('should not render consultation button when user has only view-only privileges', () => {
      mockUseUserPrivilege.mockReturnValue({
        userPrivileges: [{ uuid: 'priv-1', name: 'View Allergies' }],
      });

      renderComponent();

      expect(
        screen.queryByTestId('consultation-action-button'),
      ).not.toBeInTheDocument();
    });

    test('should render consultation button when user has all edit privileges', () => {
      renderComponent();

      expect(
        screen.getByTestId('consultation-action-button'),
      ).toBeInTheDocument();
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { container } = renderComponent();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
