import { useTranslation } from '@bahmni/services';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services');

// Export object for mock return values - defined before jest.mock uses it
export const mockWidgets = {
  mockUseUserPrivilegeReturn: {
    userPrivileges: [
      { uuid: '1', name: 'Add Allergies' },
      { uuid: '2', name: 'Add Orders' },
      { uuid: '3', name: 'Add Diagnoses' },
      { uuid: '4', name: 'Add Medications' },
      { uuid: '5', name: 'Add Vaccinations' },
    ],
    isLoading: false,
    error: null,
  },
};

// Mock the PatientDetails component
jest.mock('@bahmni/widgets', () => ({
  __esModule: true,
  PatientDetails: () => (
    <div data-testid="patient-details-mock">PatientDetails Mock</div>
  ),
  useActivePractitioner: jest.fn(() => ({
    uuid: 'active-practitioner-uuid',
    practitioner: { uuid: 'active-practitioner-uuid' },
  })),
  usePatientUUID: jest.fn(() => 'patient-uuid'),
  useUserPrivilege: jest.fn(function mockUseUserPrivilege() {
    return mockWidgets.mockUseUserPrivilegeReturn;
  }),
}));

import PatientHeader from '../PatientHeader';

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
    // Reset useUserPrivilege mock to default (all edit privileges)
    mockWidgets.mockUseUserPrivilegeReturn = {
      userPrivileges: [
        { uuid: '1', name: 'Add Allergies' },
        { uuid: '2', name: 'Add Orders' },
        { uuid: '3', name: 'Add Diagnoses' },
        { uuid: '4', name: 'Add Medications' },
        { uuid: '5', name: 'Add Vaccinations' },
      ],
      isLoading: false,
      error: null,
    };
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

  // Accessibility tests
  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { container } = renderComponent();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // Privilege tests
  describe('Privilege-based rendering', () => {
    it('should render button when user has edit privilege', () => {
      // Button should render by default (has all privileges)
      renderComponent();
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeNull();
    });

    it('should not render button when user has only view privilege', () => {
      // Mock user with only view privileges
      mockWidgets.mockUseUserPrivilegeReturn = {
        userPrivileges: [
          { uuid: '1', name: 'View Allergies' },
          { uuid: '2', name: 'View Orders' },
        ],
        isLoading: false,
        error: null,
      };

      renderComponent();
      const button = screen.queryByRole('button');
      expect(button).not.toBeInTheDocument();
    });

    it('should not render button when user has no privileges', () => {
      mockWidgets.mockUseUserPrivilegeReturn = {
        userPrivileges: [],
        isLoading: false,
        error: null,
      };

      renderComponent();
      const button = screen.queryByRole('button');
      expect(button).not.toBeInTheDocument();
    });

    it('should render button when user has at least one edit privilege', () => {
      // Only one edit privilege
      mockWidgets.mockUseUserPrivilegeReturn = {
        userPrivileges: [{ uuid: '1', name: 'Add Allergies' }],
        isLoading: false,
        error: null,
      };

      renderComponent();
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });
});
