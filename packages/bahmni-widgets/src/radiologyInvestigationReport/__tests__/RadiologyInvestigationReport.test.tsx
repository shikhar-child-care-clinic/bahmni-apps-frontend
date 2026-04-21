import { getDiagnosticReportBundle } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { Observation } from 'fhir/r4';
import { RadiologyInvestigationReport } from '../RadiologyInvestigationReport';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getDiagnosticReportBundle: jest.fn(),
}));

describe('RadiologyInvestigationReport Component', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it('should render loading state when data is being fetched', () => {
    (getDiagnosticReportBundle as jest.Mock).mockImplementation(
      () => new Promise(() => {}),
    );

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);

    expect(screen.getByTestId(/skeleton/i)).toBeInTheDocument();
  });

  it('should render empty state when no observations exist', async () => {
    (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      entry: [],
    });

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);

    expect(await screen.findByText(/NO_REPORT_DATA/)).toBeInTheDocument();
  });

  it('should render observations without members', async () => {
    const mockObservation: Observation = {
      resourceType: 'Observation',
      id: 'obs-1',
      status: 'final',
      code: {
        text: 'Heart Rate',
      },
      valueQuantity: {
        value: 72,
        unit: 'bpm',
      },
    };

    (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      entry: [{ resource: mockObservation }],
    });

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);

    expect(
      await screen.findByTestId('observations-renderer-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('observation-item-Heart Rate-0'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('observation-label-Heart Rate-0'),
    ).toHaveTextContent('Heart Rate');
    expect(
      screen.getByTestId('observation-value-Heart Rate-0'),
    ).toHaveTextContent('72 bpm');
  });

  it('should render observations with reference range', async () => {
    const mockObservation: Observation = {
      resourceType: 'Observation',
      id: 'obs-1',
      status: 'final',
      code: {
        text: 'Blood Glucose',
      },
      valueQuantity: {
        value: 95,
        unit: 'mg/dL',
      },
      referenceRange: [
        {
          type: {
            coding: [
              {
                system:
                  'http://terminology.hl7.org/CodeSystem/referencerange-meaning',
                code: 'normal',
              },
            ],
          },
          low: { value: 70 },
          high: { value: 100 },
        },
      ],
    };

    (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      entry: [{ resource: mockObservation }],
    });

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);

    await screen.findByTestId('observations-renderer-test-id');

    expect(
      screen.getByTestId('observation-label-Blood Glucose-0'),
    ).toHaveTextContent('Blood Glucose');
    expect(
      screen.getByTestId('observation-label-Blood Glucose-0'),
    ).toHaveTextContent('(70 - 100)');
    expect(
      screen.getByTestId('observation-value-Blood Glucose-0'),
    ).toHaveTextContent('95 mg/dL');
  });

  it('should render abnormal observations with proper styling', async () => {
    const mockObservation: Observation = {
      resourceType: 'Observation',
      id: 'obs-1',
      status: 'final',
      code: {
        text: 'High Temperature',
      },
      valueQuantity: {
        value: 39.5,
        unit: '°C',
      },
      interpretation: [
        {
          coding: [
            {
              system:
                'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
              code: 'A',
            },
          ],
        },
      ],
      referenceRange: [
        {
          type: {
            coding: [
              {
                system:
                  'http://terminology.hl7.org/CodeSystem/referencerange-meaning',
                code: 'normal',
              },
            ],
          },
          high: { value: 37.5 },
        },
      ],
    };

    (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      entry: [{ resource: mockObservation }],
    });

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);

    await screen.findByTestId('observations-renderer-test-id');

    const label = screen.getByTestId('observation-label-High Temperature-0');
    const value = screen.getByTestId('observation-value-High Temperature-0');

    expect(label).toHaveClass('abnormalValue');
    expect(value).toHaveClass('abnormalValue');
  });

  it('should render observations with only low reference range', async () => {
    const mockObservation: Observation = {
      resourceType: 'Observation',
      id: 'obs-1',
      status: 'final',
      code: {
        text: 'Hemoglobin',
      },
      valueQuantity: {
        value: 13,
        unit: 'g/dL',
      },
      referenceRange: [
        {
          type: {
            coding: [
              {
                system:
                  'http://terminology.hl7.org/CodeSystem/referencerange-meaning',
                code: 'normal',
              },
            ],
          },
          low: { value: 12 },
        },
      ],
    };

    (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      entry: [{ resource: mockObservation }],
    });

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);

    await screen.findByTestId('observations-renderer-test-id');

    expect(
      screen.getByTestId('observation-label-Hemoglobin-0'),
    ).toHaveTextContent('(>12)');
  });

  it('should render observations with only high reference range', async () => {
    const mockObservation: Observation = {
      resourceType: 'Observation',
      id: 'obs-1',
      status: 'final',
      code: {
        text: 'Blood Pressure',
      },
      valueQuantity: {
        value: 115,
        unit: 'mmHg',
      },
      referenceRange: [
        {
          type: {
            coding: [
              {
                system:
                  'http://terminology.hl7.org/CodeSystem/referencerange-meaning',
                code: 'normal',
              },
            ],
          },
          high: { value: 120 },
        },
      ],
    };

    (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      entry: [{ resource: mockObservation }],
    });

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);

    await screen.findByTestId('observations-renderer-test-id');

    expect(
      screen.getByTestId('observation-label-Blood Pressure-0'),
    ).toHaveTextContent('(<120)');
  });

  it('should render grouped observations with members', async () => {
    const groupObservation: Observation = {
      resourceType: 'Observation',
      id: 'group-1',
      status: 'final',
      code: {
        text: 'Complete Blood Count',
      },
      hasMember: [
        { reference: 'Observation/member-1' },
        { reference: 'Observation/member-2' },
      ],
    };

    const member1: Observation = {
      resourceType: 'Observation',
      id: 'member-1',
      status: 'final',
      code: {
        text: 'WBC',
      },
      valueQuantity: {
        value: 7000,
        unit: 'cells/μL',
      },
    };

    const member2: Observation = {
      resourceType: 'Observation',
      id: 'member-2',
      status: 'final',
      code: {
        text: 'RBC',
      },
      valueQuantity: {
        value: 4.5,
        unit: 'million/μL',
      },
    };

    (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      entry: [
        { resource: groupObservation },
        { resource: member1 },
        { resource: member2 },
      ],
    });

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);

    await screen.findByTestId('observations-renderer-test-id');

    expect(
      screen.getByTestId('observation-label-Complete Blood Count-0'),
    ).toHaveTextContent('Complete Blood Count');
    expect(
      screen.getByTestId('observation-group-members-Complete Blood Count-0'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('obs-member-row-WBC-0')).toBeInTheDocument();
    expect(screen.getByTestId('obs-member-label-WBC-0')).toHaveTextContent(
      'WBC',
    );
    expect(screen.getByTestId('obs-member-value-WBC-0')).toHaveTextContent(
      '7000 cells/μL',
    );
    expect(screen.getByTestId('obs-member-row-RBC-1')).toBeInTheDocument();
  });

  it('should render nested grouped observations with proper indentation', async () => {
    const panelObservation: Observation = {
      resourceType: 'Observation',
      id: 'group-1',
      status: 'final',
      code: {
        text: 'Panel',
      },
      hasMember: [{ reference: 'Observation/nested-group-1' }],
    };

    const subPanelObservation: Observation = {
      resourceType: 'Observation',
      id: 'nested-group-1',
      status: 'final',
      code: {
        text: 'Sub Panel',
      },
      hasMember: [{ reference: 'Observation/member-1' }],
    };

    const nestedValue: Observation = {
      resourceType: 'Observation',
      id: 'member-1',
      status: 'final',
      code: {
        text: 'Nested Value',
      },
      valueQuantity: {
        value: 100,
        unit: 'mg/dL',
      },
    };

    (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      entry: [
        { resource: panelObservation },
        { resource: subPanelObservation },
        { resource: nestedValue },
      ],
    });

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);

    await screen.findByTestId('observations-renderer-test-id');

    expect(
      screen.getByTestId('obs-nested-group-Sub Panel-0'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('obs-nested-group-label-Sub Panel-0'),
    ).toHaveTextContent('Sub Panel');
    expect(
      screen.getByTestId('obs-member-row-Nested Value-0'),
    ).toBeInTheDocument();
  });

  it('should render abnormal values in grouped observations', async () => {
    const groupObservation: Observation = {
      resourceType: 'Observation',
      id: 'group-1',
      status: 'final',
      code: {
        text: 'Liver Function',
      },
      hasMember: [{ reference: 'Observation/member-1' }],
    };

    const altMember: Observation = {
      resourceType: 'Observation',
      id: 'member-1',
      status: 'final',
      code: {
        text: 'ALT',
      },
      valueQuantity: {
        value: 150,
        unit: 'U/L',
      },
      interpretation: [
        {
          coding: [
            {
              system:
                'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
              code: 'A',
            },
          ],
        },
      ],
      referenceRange: [
        {
          type: {
            coding: [
              {
                system:
                  'http://terminology.hl7.org/CodeSystem/referencerange-meaning',
                code: 'normal',
              },
            ],
          },
          high: { value: 40 },
        },
      ],
    };

    (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      entry: [{ resource: groupObservation }, { resource: altMember }],
    });

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);

    await screen.findByTestId('observations-renderer-test-id');

    const memberLabel = screen.getByTestId('obs-member-label-ALT-0');
    const memberValue = screen.getByTestId('obs-member-value-ALT-0');

    expect(memberLabel).toHaveClass('abnormalValue');
    expect(memberValue).toHaveClass('abnormalValue');
    expect(memberLabel).toHaveTextContent('(<40)');
  });

  it('should render observations without units', async () => {
    const mockObservation: Observation = {
      resourceType: 'Observation',
      id: 'obs-1',
      status: 'final',
      code: {
        text: 'Result',
      },
      valueString: 'Positive',
    };

    (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      entry: [{ resource: mockObservation }],
    });

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);

    await screen.findByTestId('observations-renderer-test-id');

    expect(screen.getByTestId('observation-value-Result-0')).toHaveTextContent(
      'Positive',
    );
  });

  it('should render multiple observations together', async () => {
    const simpleObs: Observation = {
      resourceType: 'Observation',
      id: 'obs-1',
      status: 'final',
      code: {
        text: 'Simple Test',
        coding: [{ code: '12345' }],
      },
      valueQuantity: {
        value: 10,
        unit: 'mg',
      },
    };

    const groupObs: Observation = {
      resourceType: 'Observation',
      id: 'group-1',
      status: 'final',
      code: {
        text: 'Panel Test',
      },
      hasMember: [{ reference: 'Observation/member-1' }],
    };

    const panelMember: Observation = {
      resourceType: 'Observation',
      id: 'member-1',
      status: 'final',
      code: {
        text: 'Panel Member',
        coding: [{ code: '23456' }],
      },
      valueQuantity: {
        value: 20,
        unit: 'mg',
      },
    };

    (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      entry: [
        { resource: simpleObs },
        { resource: groupObs },
        { resource: panelMember },
      ],
    });

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);

    await screen.findByTestId('observations-renderer-test-id');

    expect(
      screen.getByTestId('observation-item-Simple Test-0'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('observation-item-Panel Test-1'),
    ).toBeInTheDocument();
  });

  it('should render multiselect observation values as comma separated', async () => {
    const obs1: Observation = {
      resourceType: 'Observation',
      id: 'obs-1',
      status: 'final',
      code: {
        text: 'Simple Test',
        coding: [{ code: '12345' }],
      },
      valueQuantity: {
        value: 10,
        unit: 'mg',
      },
    };

    const obs2: Observation = {
      resourceType: 'Observation',
      id: 'obs-2',
      status: 'final',
      code: {
        text: 'Simple Test',
        coding: [{ code: '12345' }],
      },
      valueQuantity: {
        value: 20,
        unit: 'mg',
      },
    };

    (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      entry: [{ resource: obs1 }, { resource: obs2 }],
    });

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);
    await screen.findByTestId('observations-renderer-test-id');

    expect(
      screen.getByTestId('observation-item-Simple Test-0'),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId('observation-item-Simple Test-0'),
    ).toHaveTextContent('10, 20 mg');
  });
});
