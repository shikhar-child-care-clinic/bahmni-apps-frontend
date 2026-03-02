import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getDocumentReferences, useSubscribeConsultationSaved } from '@bahmni/services';
import { useNotification } from '../../notification';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import DocumentsTable from '../DocumentsTable';

jest.mock('../../notification');
jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  formatDate: () => ({
    formattedResult: '2024-01-15 10:30 AM',
  }),
  getDocumentReferences: jest.fn(),
  useSubscribeConsultationSaved: jest.fn(),
}));
jest.mock('@carbon/icons-react', () => ({
  DocumentPdf: () => <div data-testid="pdf-icon">PDF</div>,
  Image: () => <div data-testid="image-icon">IMG</div>,
  Document: () => <div data-testid="document-icon">DOC</div>,
}));

const mockedGetDocumentReferences = getDocumentReferences as jest.MockedFunction<
  typeof getDocumentReferences
>;
const mockAddNotification = jest.fn();

const makeFhirBundle = (docs: any[]) => ({
  resourceType: 'Bundle',
  type: 'searchset',
  entry: docs.map((doc) => ({ resource: doc })),
});

const fhirPrescriptionDoc = {
  resourceType: 'DocumentReference',
  id: 'doc-1',
  masterIdentifier: { value: 'Prescription_2024' },
  status: 'current',
  type: {
    coding: [{ display: 'Prescription' }],
  },
  date: '2024-01-15T10:30:00Z',
  author: [{ display: 'Dr. Smith' }],
  content: [
    {
      attachment: {
        contentType: 'application/pdf',
        url: '100/doc-uuid__prescription.pdf',
      },
    },
  ],
};

const fhirXrayDoc = {
  resourceType: 'DocumentReference',
  id: 'doc-2',
  masterIdentifier: { value: 'XRay_Report_2024' },
  status: 'current',
  type: {
    coding: [{ display: 'Radiology Report' }],
  },
  date: '2024-01-10T14:45:00Z',
  author: [{ display: 'Dr. Williams' }],
  content: [
    {
      attachment: {
        contentType: 'image/jpeg',
        url: '100/doc-uuid__xray.jpg',
      },
    },
  ],
};

const fhirLabDoc = {
  resourceType: 'DocumentReference',
  id: 'doc-3',
  masterIdentifier: { value: 'Lab_Result_2024' },
  status: 'current',
  type: {
    coding: [{ display: 'Lab Result' }],
  },
  date: '2024-01-08T09:00:00Z',
  author: [{ display: 'Dr. Martinez' }],
  content: [
    {
      attachment: {
        contentType: 'application/pdf',
        url: '100/doc-uuid__lab.pdf',
      },
    },
  ],
};

describe('DocumentsTable Integration', () => {
  let queryClient: QueryClient;

  const defaultConfig = {
    fields: ['documentIdentifier', 'documentType', 'uploadedOn', 'uploadedBy'],
  };

  const renderComponent = (props = {}) =>
    render(
      <QueryClientProvider client={queryClient}>
        <DocumentsTable {...{ config: defaultConfig, ...props }} />
      </QueryClientProvider>,
    );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
        },
      },
    });
    jest.clearAllMocks();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('displays patient documents with all clinical information after fetch', async () => {
    mockedGetDocumentReferences.mockResolvedValueOnce(
      makeFhirBundle([fhirPrescriptionDoc]) as any,
    );

    renderComponent();

    expect(screen.getByTestId('documents-table')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    });

    expect(screen.getByText('Prescription')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByTestId('pdf-icon')).toBeInTheDocument();
  });

  it('shows empty state when patient has no recorded documents', async () => {
    mockedGetDocumentReferences.mockResolvedValueOnce(
      makeFhirBundle([]) as any,
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('DOCUMENTS_NO_RECORDS')).toBeInTheDocument();
    });
  });

  it('shows error notification when document data cannot be fetched', async () => {
    const errorMessage = 'Failed to fetch documents';
    mockedGetDocumentReferences.mockRejectedValueOnce(new Error(errorMessage));

    renderComponent();

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'ERROR_DEFAULT_TITLE',
          message: errorMessage,
        }),
      );
    });
  });

  it('displays multiple documents with correct icons', async () => {
    mockedGetDocumentReferences.mockResolvedValueOnce(
      makeFhirBundle([fhirPrescriptionDoc, fhirXrayDoc, fhirLabDoc]) as any,
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    });

    expect(screen.getByText('XRay_Report_2024')).toBeInTheDocument();
    expect(screen.getByText('Lab_Result_2024')).toBeInTheDocument();
    expect(screen.getByText('Radiology Report')).toBeInTheDocument();
    expect(screen.getByText('Lab Result')).toBeInTheDocument();
    expect(screen.getAllByTestId('pdf-icon')).toHaveLength(2);
    expect(screen.getByTestId('image-icon')).toBeInTheDocument();
  });

  it('opens modal with PDF iframe when icon button is clicked', async () => {
    const user = userEvent.setup();
    mockedGetDocumentReferences.mockResolvedValueOnce(
      makeFhirBundle([fhirPrescriptionDoc]) as any,
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('button', { name: 'View Prescription_2024' }),
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const iframe = screen.getByTitle('Prescription_2024');
    expect(iframe.tagName).toBe('IFRAME');
    expect(iframe).toHaveAttribute(
      'src',
      expect.stringContaining('/openmrs/auth?requested_document=/document_images/'),
    );
  });

  it('opens modal with img element when image icon button is clicked', async () => {
    const user = userEvent.setup();
    mockedGetDocumentReferences.mockResolvedValueOnce(
      makeFhirBundle([fhirXrayDoc]) as any,
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('XRay_Report_2024')).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('button', { name: 'View XRay_Report_2024' }),
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const image = screen.getByRole('img', { name: 'XRay_Report_2024' });
    expect(image).toBeInTheDocument();
  });

  it('closes modal after clicking close button', async () => {
    const user = userEvent.setup();
    mockedGetDocumentReferences.mockResolvedValueOnce(
      makeFhirBundle([fhirPrescriptionDoc]) as any,
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('button', { name: 'View Prescription_2024' }),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog'),
      ).not.toBeInTheDocument();
    });
  });

  it('passes encounterUuids filter to service when provided', async () => {
    mockedGetDocumentReferences.mockResolvedValueOnce(
      makeFhirBundle([fhirPrescriptionDoc]) as any,
    );

    const encounterUuids = ['encounter-uuid-1', 'encounter-uuid-2'];
    renderComponent({ encounterUuids });

    await waitFor(() => {
      expect(mockedGetDocumentReferences).toHaveBeenCalledWith(
        'test-patient-uuid',
        encounterUuids,
      );
    });
  });

  it('calls service without encounter filter when encounterUuids is not provided', async () => {
    mockedGetDocumentReferences.mockResolvedValueOnce(
      makeFhirBundle([fhirPrescriptionDoc]) as any,
    );

    renderComponent();

    await waitFor(() => {
      expect(mockedGetDocumentReferences).toHaveBeenCalledWith(
        'test-patient-uuid',
        undefined,
      );
    });
  });

  it('renders documents in the order returned by the service (latest first)', async () => {
    // API returns sorted by _sort=-date (latest first):
    // fhirPrescriptionDoc: Jan 15, fhirXrayDoc: Jan 10
    mockedGetDocumentReferences.mockResolvedValueOnce(
      makeFhirBundle([fhirPrescriptionDoc, fhirXrayDoc]) as any,
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    });

    const rows = screen.getAllByRole('row');
    // rows[0] is the header row; data rows start at index 1
    expect(rows[1]).toHaveTextContent('Prescription_2024');
    expect(rows[2]).toHaveTextContent('XRay_Report_2024');
  });

  it('refetches documents when a consultation is saved for the current patient', async () => {
    let capturedCallback: ((payload: any) => void) | undefined;
    (useSubscribeConsultationSaved as jest.Mock).mockImplementation((cb: (payload: any) => void) => {
      capturedCallback = cb;
    });

    mockedGetDocumentReferences
      .mockResolvedValueOnce(makeFhirBundle([fhirPrescriptionDoc]) as any)
      .mockResolvedValueOnce(makeFhirBundle([fhirPrescriptionDoc, fhirXrayDoc]) as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    });

    act(() => {
      capturedCallback?.({ patientUUID: 'test-patient-uuid' });
    });

    await waitFor(() => {
      expect(mockedGetDocumentReferences).toHaveBeenCalledTimes(2);
      expect(screen.getByText('XRay_Report_2024')).toBeInTheDocument();
    });
  });

  it('does not refetch documents when consultation saved for a different patient', async () => {
    let capturedCallback: ((payload: any) => void) | undefined;
    (useSubscribeConsultationSaved as jest.Mock).mockImplementation((cb: (payload: any) => void) => {
      capturedCallback = cb;
    });

    mockedGetDocumentReferences.mockResolvedValueOnce(
      makeFhirBundle([fhirPrescriptionDoc]) as any,
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    });

    act(() => {
      capturedCallback?.({ patientUUID: 'different-patient-uuid' });
    });

    await act(async () => {});

    expect(mockedGetDocumentReferences).toHaveBeenCalledTimes(1);
  });

  it('does not call the API when patientUUID is null', async () => {
    (usePatientUUID as jest.Mock).mockReturnValue(null);
    mockedGetDocumentReferences.mockResolvedValueOnce(makeFhirBundle([]) as any);

    renderComponent();

    // Wait a render cycle to ensure no query fires
    await act(async () => {});

    expect(mockedGetDocumentReferences).not.toHaveBeenCalled();
  });

});
