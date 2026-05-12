import { useTranslation } from '@bahmni/services';
import { useActivePractitioner, useHasPrivilege } from '@bahmni/widgets';
import { render, screen, fireEvent } from '@testing-library/react';
import { dispatchConsultationStart } from '../../../events/startConsultation';
import { useEncounterSession } from '../../../hooks/useEncounterSession';
import ConsultationActionButton from '../ConsultationActionButton';
import '@testing-library/jest-dom';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
}));

jest.mock('../../../events/startConsultation', () => ({
  dispatchConsultationStart: jest.fn(),
}));
jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useActivePractitioner: jest.fn(),
  useHasPrivilege: jest.fn(),
}));
jest.mock('../../../hooks/useEncounterSession', () => ({
  useEncounterSession: jest.fn(),
}));

const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;
const mockUseActivePractitioner = useActivePractitioner as jest.MockedFunction<
  typeof useActivePractitioner
>;
const mockUseHasPrivilege = useHasPrivilege as jest.MockedFunction<
  typeof useHasPrivilege
>;
const mockUseEncounterSession = useEncounterSession as jest.MockedFunction<
  typeof useEncounterSession
>;

const mockDispatchConsultationStart =
  dispatchConsultationStart as jest.MockedFunction<
    typeof dispatchConsultationStart
  >;

describe('ConsultationActionButton', () => {
  const defaultProps = {
    isActionAreaVisible: false,
  };

  let mockRefetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRefetch = jest.fn().mockResolvedValue(undefined);

    mockUseTranslation.mockReturnValue({ t: (key: string) => key } as any);
    mockUseActivePractitioner.mockReturnValue({
      practitioner: { uuid: 'practitioner-uuid' },
    } as any);
    mockUseEncounterSession.mockReturnValue({
      editActiveEncounter: false,
      isLoading: false,
      refetch: mockRefetch,
    } as any);
  });

  describe('when user has Add Encounters privilege', () => {
    beforeEach(() => {
      mockUseHasPrivilege.mockReturnValue(true);
    });

    it('renders button with default "New Consultation" text', () => {
      render(<ConsultationActionButton {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /CONSULTATION_ACTION_NEW/i }),
      ).toBeInTheDocument();
    });

    it('shows "Edit Consultation" text when active encounter exists', () => {
      mockUseEncounterSession.mockReturnValue({
        editActiveEncounter: true,
        isLoading: false,
        refetch: mockRefetch,
      } as any);
      render(<ConsultationActionButton {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /CONSULTATION_ACTION_EDIT/i }),
      ).toBeInTheDocument();
    });

    it('disables button when action area is visible', () => {
      const { rerender } = render(
        <ConsultationActionButton {...defaultProps} />,
      );

      expect(
        screen.getByRole('button', { name: /CONSULTATION_ACTION_NEW/i }),
      ).not.toBeDisabled();

      rerender(
        <ConsultationActionButton {...defaultProps} isActionAreaVisible />,
      );

      expect(
        screen.getByRole('button', {
          name: /CONSULTATION_ACTION_IN_PROGRESS/i,
        }),
      ).toBeDisabled();
    });

    it('dispatches consultationStart event on click', () => {
      render(<ConsultationActionButton {...defaultProps} />);

      fireEvent.click(screen.getByTestId('consultation-action-button'));

      expect(mockDispatchConsultationStart).toHaveBeenCalled();
    });

    it('disables button when loading', () => {
      mockUseEncounterSession.mockReturnValue({
        editActiveEncounter: false,
        isLoading: true,
        refetch: mockRefetch,
      } as any);
      render(<ConsultationActionButton {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /CONSULTATION_ACTION_NEW/i }),
      ).toBeDisabled();
    });

    it('calls refetch when action area closes (isActionAreaVisible transitions true to false)', () => {
      const { rerender } = render(
        <ConsultationActionButton isActionAreaVisible={true} />,
      );

      // Transition: action area visible → hidden (consultation pad closed)
      rerender(<ConsultationActionButton isActionAreaVisible={false} />);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('does not call refetch when action area becomes visible', () => {
      const { rerender } = render(
        <ConsultationActionButton isActionAreaVisible={false} />,
      );

      rerender(<ConsultationActionButton isActionAreaVisible={true} />);

      expect(mockRefetch).not.toHaveBeenCalled();
    });

    it('does not call refetch on initial render with action area hidden', () => {
      render(<ConsultationActionButton isActionAreaVisible={false} />);

      expect(mockRefetch).not.toHaveBeenCalled();
    });
  });

  it('hides button when user lacks Add Encounters privilege', () => {
    mockUseHasPrivilege.mockReturnValue(false);

    render(<ConsultationActionButton {...defaultProps} />);

    expect(
      screen.queryByRole('button', { name: /CONSULTATION_ACTION_(NEW|EDIT)/i }),
    ).not.toBeInTheDocument();
  });
});
