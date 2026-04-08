import { useTranslation } from '@bahmni/services';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { RegistrationFormSection } from '../../../providers/registrationConfig/models';
import { FormControlRefs, FormControlData, FormControlGuards } from '../models';
import PatientRegisterSection from '../PatientRegisterSection';

// Mock useTranslation
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
}));

// Mock the formSectionMap
jest.mock('../formSectionMap', () => ({
  builtInFormSections: [
    {
      type: 'profile',
      component: () => <div data-testid="profile-component">Profile</div>,
      render: () => <div data-testid="profile-component">Profile</div>,
    },
    {
      type: 'address',
      component: () => <div data-testid="address-component">Address</div>,
      render: () => <div data-testid="address-component">Address</div>,
    },
    {
      type: 'unknownType',
      component: () => null,
      render: () => null,
    },
  ],
}));

// Mock @carbon/icons-react
jest.mock('@carbon/icons-react', () => ({
  ChevronDown: ({
    className,
    'aria-hidden': ariaHidden,
  }: {
    className?: string;
    'aria-hidden'?: string;
  }) => (
    <svg
      data-testid="chevron-icon"
      className={className}
      aria-hidden={ariaHidden}
    />
  ),
}));

const mockTranslate = jest.fn((key: string) => key);

const mockRefs: FormControlRefs = {
  profileRef: React.createRef(),
  addressRef: React.createRef(),
  contactRef: React.createRef(),
  additionalRef: React.createRef(),
  additionalIdentifiersRef: React.createRef(),
  relationshipsRef: React.createRef(),
};

const mockData: FormControlData = {
  profileInitialData: undefined,
  addressInitialData: undefined,
  personAttributesInitialData: undefined,
  additionalIdentifiersInitialData: undefined,
  relationshipsInitialData: undefined,
  initialDobEstimated: false,
  patientPhoto: undefined,
};

const mockGuards: FormControlGuards = {
  shouldShowAdditionalIdentifiers: true,
  relationshipTypes: [],
};

const defaultProps = {
  refs: mockRefs,
  data: mockData,
  guards: mockGuards,
  isCollapsible: false,
  isExpanded: true,
  onToggle: jest.fn(),
};

describe('PatientRegisterSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTranslation as jest.Mock).mockReturnValue({ t: mockTranslate });
  });

  describe('conditional rendering', () => {
    it('should render null when all controls have unknown types', () => {
      const section: RegistrationFormSection = {
        name: 'empty-section',
        translationKey: 'SECTION_TITLE',
        controls: [{ type: 'unknownType' }],
      };

      const { container } = render(
        <PatientRegisterSection {...defaultProps} section={section} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render section header tile when section has translationKey', () => {
      const section: RegistrationFormSection = {
        name: 'basic-info',
        translationKey: 'SECTION_TITLE',
        controls: [{ type: 'profile' }],
      };

      render(<PatientRegisterSection {...defaultProps} section={section} />);

      const headerTile = screen.getByTestId('section-header-tile');
      expect(headerTile).toBeInTheDocument();
      expect(headerTile).toHaveTextContent('SECTION_TITLE');
    });

    it('should not render section header tile when section has no translationKey', () => {
      const section: RegistrationFormSection = {
        name: 'basic-info',
        controls: [{ type: 'profile' }],
      };

      const { queryByTestId } = render(
        <PatientRegisterSection {...defaultProps} section={section} />,
      );

      expect(queryByTestId('section-header-tile')).not.toBeInTheDocument();
    });

    it('should render control title when control has titleTranslationKey', () => {
      const section: RegistrationFormSection = {
        name: 'basic-info',
        controls: [{ type: 'profile', titleTranslationKey: 'CONTROL_TITLE' }],
      };

      render(<PatientRegisterSection {...defaultProps} section={section} />);

      const controlTitle = screen.getByTestId('control-title-profile');
      expect(controlTitle).toBeInTheDocument();
      expect(controlTitle).toHaveTextContent('CONTROL_TITLE');
    });

    it('should not render control title when control has no titleTranslationKey', () => {
      const section: RegistrationFormSection = {
        name: 'basic-info',
        controls: [{ type: 'profile' }],
      };

      const { queryByTestId } = render(
        <PatientRegisterSection {...defaultProps} section={section} />,
      );

      expect(queryByTestId('control-title-profile')).not.toBeInTheDocument();
    });
  });

  describe('multiple controls', () => {
    it('should render multiple controls in a single section', () => {
      const section: RegistrationFormSection = {
        name: 'basic-info',
        translationKey: 'BASIC_INFO',
        controls: [
          { type: 'profile', titleTranslationKey: 'PROFILE_TITLE' },
          { type: 'address', titleTranslationKey: 'ADDRESS_TITLE' },
        ],
      };

      render(<PatientRegisterSection {...defaultProps} section={section} />);

      expect(screen.getByTestId('profile-component')).toBeInTheDocument();
      expect(screen.getByTestId('address-component')).toBeInTheDocument();
      expect(screen.getByTestId('control-title-profile')).toBeInTheDocument();
      expect(screen.getByTestId('control-title-address')).toBeInTheDocument();
    });
  });

  describe('unknown types handling', () => {
    it('should skip unrecognized control types while rendering valid ones', () => {
      const section: RegistrationFormSection = {
        name: 'mixed-section',
        translationKey: 'MIXED_SECTION',
        controls: [
          { type: 'profile' },
          { type: 'unknownType' },
          { type: 'address' },
        ],
      };

      render(<PatientRegisterSection {...defaultProps} section={section} />);

      // Should render valid controls
      expect(screen.getByTestId('profile-component')).toBeInTheDocument();
      expect(screen.getByTestId('address-component')).toBeInTheDocument();

      // Should still have header tile
      expect(screen.getByTestId('section-header-tile')).toBeInTheDocument();
    });
  });

  describe('translation calls', () => {
    it('should call t() for section translationKey', () => {
      const section: RegistrationFormSection = {
        name: 'basic-info',
        translationKey: 'SECTION_TITLE',
        controls: [{ type: 'profile' }],
      };

      render(<PatientRegisterSection {...defaultProps} section={section} />);

      expect(mockTranslate).toHaveBeenCalledWith('SECTION_TITLE');
    });

    it('should call t() for control titleTranslationKey', () => {
      const section: RegistrationFormSection = {
        name: 'basic-info',
        controls: [{ type: 'profile', titleTranslationKey: 'CONTROL_TITLE' }],
      };

      render(<PatientRegisterSection {...defaultProps} section={section} />);

      expect(mockTranslate).toHaveBeenCalledWith('CONTROL_TITLE');
    });
  });

  describe('collapsible behavior', () => {
    it('should render collapsible header button when isCollapsible=true', () => {
      const section: RegistrationFormSection = {
        name: 'collapsible-section',
        translationKey: 'SECTION_TITLE',
        controls: [{ type: 'profile' }],
      };

      render(
        <PatientRegisterSection
          {...defaultProps}
          section={section}
          isCollapsible
          isExpanded
        />,
      );

      expect(
        screen.getByTestId('collapsible-toggle-button'),
      ).toBeInTheDocument();
      // The Tile wrapper should still be present
      expect(screen.getByTestId('section-header-tile')).toBeInTheDocument();
    });

    it('should NOT render collapsible header button when isCollapsible=false', () => {
      const section: RegistrationFormSection = {
        name: 'non-collapsible-section',
        translationKey: 'SECTION_TITLE',
        controls: [{ type: 'profile' }],
      };

      render(
        <PatientRegisterSection
          {...defaultProps}
          section={section}
          isCollapsible={false}
          isExpanded
        />,
      );

      const header = screen.getByTestId('section-header-tile');
      expect(header.tagName.toLowerCase()).not.toBe('button');
    });

    it('should render content when isCollapsible=false (always expanded)', () => {
      const section: RegistrationFormSection = {
        name: 'non-collapsible-section',
        translationKey: 'SECTION_TITLE',
        controls: [{ type: 'profile' }],
      };

      render(
        <PatientRegisterSection
          {...defaultProps}
          section={section}
          isCollapsible={false}
          isExpanded
        />,
      );

      expect(screen.getByTestId('profile-component')).toBeInTheDocument();
      const content = screen.getByTestId('section-content');
      expect(content).not.toHaveClass('sectionContentCollapsed');
    });

    it('should render content when isCollapsible=true and isExpanded=true', () => {
      const section: RegistrationFormSection = {
        name: 'collapsible-section',
        translationKey: 'SECTION_TITLE',
        controls: [{ type: 'profile' }],
      };

      render(
        <PatientRegisterSection
          {...defaultProps}
          section={section}
          isCollapsible
          isExpanded
        />,
      );

      const content = screen.getByTestId('section-content');
      expect(content).not.toHaveClass('sectionContentCollapsed');
      expect(screen.getByTestId('profile-component')).toBeInTheDocument();
    });

    it('should NOT render content when isCollapsible=true and isExpanded=false', () => {
      const section: RegistrationFormSection = {
        name: 'collapsible-section',
        translationKey: 'SECTION_TITLE',
        controls: [{ type: 'profile' }],
      };

      render(
        <PatientRegisterSection
          {...defaultProps}
          section={section}
          isCollapsible
          isExpanded={false}
        />,
      );

      const content = screen.getByTestId('section-content');
      expect(content).toHaveClass('sectionContentCollapsed');
    });

    it('should call onToggle when clicking section header (collapsible)', () => {
      const onToggle = jest.fn();
      const section: RegistrationFormSection = {
        name: 'collapsible-section',
        translationKey: 'SECTION_TITLE',
        controls: [{ type: 'profile' }],
      };

      render(
        <PatientRegisterSection
          {...defaultProps}
          section={section}
          isCollapsible
          isExpanded
          onToggle={onToggle}
        />,
      );

      fireEvent.click(screen.getByTestId('collapsible-toggle-button'));
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('should NOT call onToggle when clicking non-collapsible section header', () => {
      const onToggle = jest.fn();
      const section: RegistrationFormSection = {
        name: 'non-collapsible-section',
        translationKey: 'SECTION_TITLE',
        controls: [{ type: 'profile' }],
      };

      render(
        <PatientRegisterSection
          {...defaultProps}
          section={section}
          isCollapsible={false}
          isExpanded
          onToggle={onToggle}
        />,
      );

      const header = screen.getByTestId('section-header-tile');
      fireEvent.click(header);
      expect(onToggle).not.toHaveBeenCalled();
    });

    it('should have aria-expanded=true when isExpanded=true', () => {
      const section: RegistrationFormSection = {
        name: 'collapsible-section',
        translationKey: 'SECTION_TITLE',
        controls: [{ type: 'profile' }],
      };

      render(
        <PatientRegisterSection
          {...defaultProps}
          section={section}
          isCollapsible
          isExpanded
        />,
      );

      expect(screen.getByTestId('collapsible-toggle-button')).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    });

    it('should have aria-expanded=false when isExpanded=false', () => {
      const section: RegistrationFormSection = {
        name: 'collapsible-section',
        translationKey: 'SECTION_TITLE',
        controls: [{ type: 'profile' }],
      };

      render(
        <PatientRegisterSection
          {...defaultProps}
          section={section}
          isCollapsible
          isExpanded={false}
        />,
      );

      expect(screen.getByTestId('collapsible-toggle-button')).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });

    it('should render chevron icon when section is collapsible', () => {
      const section: RegistrationFormSection = {
        name: 'collapsible-section',
        translationKey: 'SECTION_TITLE',
        controls: [{ type: 'profile' }],
      };

      render(
        <PatientRegisterSection
          {...defaultProps}
          section={section}
          isCollapsible
          isExpanded={false}
        />,
      );

      expect(screen.getByTestId('chevron-icon')).toBeInTheDocument();
    });
  });

  describe('keyboard navigation', () => {
    it('should call onToggle when pressing Enter on collapsible header', () => {
      const onToggle = jest.fn();
      const section: RegistrationFormSection = {
        name: 'collapsible-section',
        translationKey: 'SECTION_TITLE',
        controls: [{ type: 'profile' }],
      };

      render(
        <PatientRegisterSection
          {...defaultProps}
          section={section}
          isCollapsible
          isExpanded
          onToggle={onToggle}
        />,
      );

      fireEvent.keyDown(screen.getByTestId('collapsible-toggle-button'), {
        key: 'Enter',
      });
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('should call onToggle when pressing Space on collapsible header', () => {
      const onToggle = jest.fn();
      const section: RegistrationFormSection = {
        name: 'collapsible-section',
        translationKey: 'SECTION_TITLE',
        controls: [{ type: 'profile' }],
      };

      render(
        <PatientRegisterSection
          {...defaultProps}
          section={section}
          isCollapsible
          isExpanded
          onToggle={onToggle}
        />,
      );

      fireEvent.keyDown(screen.getByTestId('collapsible-toggle-button'), {
        key: ' ',
      });
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('should NOT call onToggle when pressing Enter on non-collapsible header', () => {
      const onToggle = jest.fn();
      const section: RegistrationFormSection = {
        name: 'non-collapsible-section',
        translationKey: 'SECTION_TITLE',
        controls: [{ type: 'profile' }],
      };

      render(
        <PatientRegisterSection
          {...defaultProps}
          section={section}
          isCollapsible={false}
          isExpanded
          onToggle={onToggle}
        />,
      );

      const header = screen.getByTestId('section-header-tile');
      fireEvent.keyDown(header, { key: 'Enter' });
      expect(onToggle).not.toHaveBeenCalled();
    });

    it('should NOT call onToggle when pressing other keys on collapsible header', () => {
      const onToggle = jest.fn();
      const section: RegistrationFormSection = {
        name: 'collapsible-section',
        translationKey: 'SECTION_TITLE',
        controls: [{ type: 'profile' }],
      };

      render(
        <PatientRegisterSection
          {...defaultProps}
          section={section}
          isCollapsible
          isExpanded
          onToggle={onToggle}
        />,
      );

      const header = screen.getByTestId('section-header-tile');
      fireEvent.keyDown(header, { key: 'Tab' });
      expect(onToggle).not.toHaveBeenCalled();
    });
  });
});
