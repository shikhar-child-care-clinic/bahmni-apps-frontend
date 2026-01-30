import { useTranslation } from '@bahmni/services';
import { render, screen } from '@testing-library/react';

import LabInvestigationItem from '../LabInvestigationItem';
import { FormattedLabInvestigations, LabTestPriority } from '../models';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;
describe('LabInvestigationItem', () => {
  const baseLabTest: FormattedLabInvestigations = {
    id: 'test-123',
    testName: 'Complete Blood Count',
    priority: LabTestPriority.routine,
    orderedBy: 'Dr. Smith',
    orderedDate: '2025-05-08T12:44:24+00:00',
    formattedDate: '05/08/2025',
    result: undefined,
    testType: 'Individual',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTranslation.mockReturnValue({
      t: ((key: string) => {
        const translations: Record<string, string> = {
          LAB_TEST_PANEL: 'Panel',
          LAB_TEST_STAT: 'STAT',
          LAB_TEST_URGENT: 'STAT',
          LAB_TEST_ORDERED_BY: 'Ordered by',
          LAB_TEST_RESULTS_PENDING: 'Results Pending',
        };
        return translations[key] || key;
      }) as any,
    } as any);
  });

  it('renders test name', () => {
    render(<LabInvestigationItem test={baseLabTest} />);

    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
  });

  it('renders ordered by information', () => {
    render(<LabInvestigationItem test={baseLabTest} />);

    expect(screen.getByText('Ordered by: Dr. Smith')).toBeInTheDocument();
  });

  it('renders results pending message', () => {
    render(<LabInvestigationItem test={baseLabTest} />);

    expect(screen.getByText('Results Pending ....')).toBeInTheDocument();
  });

  it('shows test type info only for Panel tests', () => {
    const panelTest = { ...baseLabTest, testType: 'Panel' };
    render(<LabInvestigationItem test={panelTest} />);

    expect(screen.getByText('Panel')).toBeInTheDocument();
  });

  it('does not show test type info for non-Panel tests', () => {
    render(<LabInvestigationItem test={baseLabTest} />);

    expect(screen.queryByText('Individual')).not.toBeInTheDocument();
  });

  it('shows priority tag for stat priority', () => {
    const statTest = { ...baseLabTest, priority: LabTestPriority.stat };
    render(<LabInvestigationItem test={statTest} />);

    expect(screen.getByText('STAT')).toBeInTheDocument();
  });

  it('does not show priority tag for routine priority', () => {
    render(<LabInvestigationItem test={baseLabTest} />);

    expect(screen.queryByText('STAT')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(`lab-test-priority-${LabTestPriority.routine}`),
    ).not.toBeInTheDocument();
  });

  it('renders Panel test with stat priority correctly', () => {
    const panelStatTest = {
      ...baseLabTest,
      testType: 'Panel',
      priority: LabTestPriority.stat,
    };
    render(<LabInvestigationItem test={panelStatTest} />);

    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    expect(screen.getByText('Panel')).toBeInTheDocument();
    expect(screen.getByText('STAT')).toBeInTheDocument();
    expect(screen.getByText('Ordered by: Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('Results Pending ....')).toBeInTheDocument();
  });

  it('renders note tooltip when note is present', () => {
    const testWithNote = {
      ...baseLabTest,
      note: 'Patient fasting required',
    };
    render(<LabInvestigationItem test={testWithNote} />);

    const tooltipButton = screen.getByRole('button', {
      name: 'Show information',
    });
    expect(tooltipButton).toBeInTheDocument();
    expect(screen.getByText('Patient fasting required')).toBeInTheDocument();
  });

  it('does not render note tooltip when note is absent', () => {
    render(<LabInvestigationItem test={baseLabTest} />);

    const tooltipButton = screen.queryByRole('button', {
      name: 'Show information',
    });
    expect(tooltipButton).not.toBeInTheDocument();
  });

  it('renders results table when test has results', () => {
    const testWithResults = {
      ...baseLabTest,
      result: [
        {
          status: 'final',
          TestName: 'Hemoglobin',
          Result: '14.5 g/dL',
          referenceRange: '12-16 g/dL',
          reportedOn: 'May 8, 2025',
          actions: '',
        },
        {
          status: 'final',
          TestName: 'WBC Count',
          Result: '7500 cells/μL',
          referenceRange: '4000-11000 cells/μL',
          reportedOn: 'May 8, 2025',
          actions: '',
        },
      ],
    };

    render(<LabInvestigationItem test={testWithResults} />);

    expect(screen.getByText('Hemoglobin')).toBeInTheDocument();
    expect(screen.getByText('14.5 g/dL')).toBeInTheDocument();
    expect(screen.getByText('12-16 g/dL')).toBeInTheDocument();
    expect(screen.getByText('WBC Count')).toBeInTheDocument();
    expect(screen.getByText('7500 cells/μL')).toBeInTheDocument();
  });

  it('does not render results table when test has no results', () => {
    render(<LabInvestigationItem test={baseLabTest} />);

    const resultTable = screen.queryByTestId(
      `lab-test-results-table-${baseLabTest.testName}`,
    );
    expect(resultTable).not.toBeInTheDocument();
    expect(screen.getByText('Results Pending ....')).toBeInTheDocument();
  });

  it('renders results table with empty result fields as dashes', () => {
    const testWithEmptyResults = {
      ...baseLabTest,
      result: [
        {
          status: 'final',
          TestName: 'Test',
          Result: '',
          referenceRange: '',
          reportedOn: '',
          actions: '',
        },
      ],
    };

    render(<LabInvestigationItem test={testWithEmptyResults} />);

    const dashes = screen.getAllByText('--');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('renders view attachment link in results table', () => {
    const testWithResults = {
      ...baseLabTest,
      result: [
        {
          status: 'final',
          TestName: 'Hemoglobin',
          Result: '14.5 g/dL',
          referenceRange: '12-16 g/dL',
          reportedOn: 'May 8, 2025',
          actions: '',
        },
      ],
    };

    render(<LabInvestigationItem test={testWithResults} />);

    const viewLink = screen.getByText('LAB_TEST_VIEW_ATTACHMENT');
    expect(viewLink).toBeInTheDocument();
  });

  it('renders multiple result rows in table', () => {
    const testWithMultipleResults = {
      ...baseLabTest,
      result: [
        {
          status: 'final',
          TestName: 'Test 1',
          Result: 'Result 1',
          referenceRange: 'Range 1',
          reportedOn: 'Date 1',
          actions: '',
        },
        {
          status: 'final',
          TestName: 'Test 2',
          Result: 'Result 2',
          referenceRange: 'Range 2',
          reportedOn: 'Date 2',
          actions: '',
        },
        {
          status: 'final',
          TestName: 'Test 3',
          Result: 'Result 3',
          referenceRange: 'Range 3',
          reportedOn: 'Date 3',
          actions: '',
        },
      ],
    };

    render(<LabInvestigationItem test={testWithMultipleResults} />);

    expect(screen.getByText('Test 1')).toBeInTheDocument();
    expect(screen.getByText('Test 2')).toBeInTheDocument();
    expect(screen.getByText('Test 3')).toBeInTheDocument();
  });
});
