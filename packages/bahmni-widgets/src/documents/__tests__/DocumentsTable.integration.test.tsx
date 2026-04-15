import {
  getDocumentReferencePage,
  useSubscribeConsultationSaved,
  DEFAULT_DATE_FORMAT_STORAGE_KEY,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useNotification } from '../../notification';
import DocumentsTable from '../DocumentsTable';

jest.mock('../../notification');
jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: () => ({ t: (key: string) => key }),
  getDocumentReferencePage: jest.fn(),
  useSubscribeConsultationSaved: jest.fn(),
}));

// Mock fetch to simulate successful document loads
globalThis.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
  } as Response),
);

const mockedGetDocumentReferencePage =
  getDocumentReferencePage as jest.MockedFunction<
    typeof getDocumentReferencePage
  >;

const wrapPage = (documents: any[], nextUrl?: string, prevUrl?: string) => ({
  documents,
  total: documents.length,
  nextUrl,
  prevUrl,
});

const mockAddNotification = jest.fn();

const prescriptionDoc = {
  id: 'doc-1',
  documentIdentifier: 'Prescription_2024',
  documentType: 'Prescription',
  uploadedOn: '2024-01-15T10:30:00Z',
  uploadedBy: 'Dr. Smith',
  contentType: 'application/pdf',
  documentUrl: '100/doc-uuid__prescription.pdf',
  attachments: [
    {
      url: '100/doc-uuid__prescription.pdf',
      contentType: 'application/pdf',
    },
  ],
};

const xrayDoc = {
  id: 'doc-2',
  documentIdentifier: 'XRay_Report_2024',
  documentType: 'Radiology Report',
  uploadedOn: '2024-01-10T14:45:00Z',
  uploadedBy: 'Dr. Williams',
  contentType: 'image/jpeg',
  documentUrl: '100/doc-uuid__xray.jpg',
  attachments: [{ url: '100/doc-uuid__xray.jpg', contentType: 'image/jpeg' }],
};

const labDoc = {
  id: 'doc-3',
  documentIdentifier: 'Lab_Result_2024',
  documentType: 'Lab Result',
  uploadedOn: '2024-01-08T09:00:00Z',
  uploadedBy: 'Dr. Martinez',
  contentType: 'application/pdf',
  documentUrl: '100/doc-uuid__lab.pdf',
  attachments: [
    { url: '100/doc-uuid__lab.pdf', contentType: 'application/pdf' },
  ],
};

const multiAttachmentDoc = {
  id: 'doc-4',
  documentIdentifier: 'MultiPage_Report_2024',
  documentType: 'Lab Result',
  uploadedOn: '2024-01-07T08:00:00Z',
  uploadedBy: 'Dr. Patel',
  contentType: 'application/pdf',
  documentUrl: '100/doc-uuid__multi-p1.pdf',
  attachments: [
    { url: '100/doc-uuid__multi-p1.pdf', contentType: 'application/pdf' },
    { url: '100/doc-uuid__multi-p2.pdf', contentType: 'application/pdf' },
  ],
};

describe('DocumentsTable Integration', () => {
  let queryClient: QueryClient;

  const defaultConfig = {
    fields: [
      'documentIdentifier',
      'documentType',
      'uploadedOn',
      'uploadedBy',
      'action',
    ],
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
    localStorage.setItem(DEFAULT_DATE_FORMAT_STORAGE_KEY, 'dd/MM/yyyy');
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('displays patient documents with all clinical information after fetch', async () => {
    mockedGetDocumentReferencePage.mockResolvedValueOnce(
      wrapPage([prescriptionDoc]),
    );

    renderComponent();

    expect(screen.getByTestId('documents-table')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    });

    expect(screen.getByText('Prescription')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS')).toBeInTheDocument();
  });

  it('shows empty state when patient has no recorded documents', async () => {
    mockedGetDocumentReferencePage.mockResolvedValueOnce(wrapPage([]));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('DOCUMENTS_NO_RECORDS')).toBeInTheDocument();
    });
  });

  it('shows error notification when document data cannot be fetched', async () => {
    const errorMessage = 'Failed to fetch documents';
    mockedGetDocumentReferencePage.mockRejectedValueOnce(
      new Error(errorMessage),
    );

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

  it('displays multiple documents with "View attachment/s" links (no icons)', async () => {
    mockedGetDocumentReferencePage.mockResolvedValueOnce(
      wrapPage([prescriptionDoc, xrayDoc, labDoc]),
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    });

    expect(screen.getByText('XRay_Report_2024')).toBeInTheDocument();
    expect(screen.getByText('Lab_Result_2024')).toBeInTheDocument();
    expect(screen.getByText('Radiology Report')).toBeInTheDocument();
    expect(screen.getByText('Lab Result')).toBeInTheDocument();

    // Three "View attachment/s" links, one per document
    expect(screen.getAllByText('DOCUMENTS_VIEW_ATTACHMENTS')).toHaveLength(3);

    // No file type icons
    expect(screen.queryByTestId('pdf-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('image-icon')).not.toBeInTheDocument();
  });

  it('opens modal with PDF iframe when "View attachment/s" is clicked', async () => {
    const user = userEvent.setup();
    mockedGetDocumentReferencePage.mockResolvedValueOnce(
      wrapPage([prescriptionDoc]),
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    });

    await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const iframe = screen.getByTitle('Prescription_2024');
    expect(iframe.tagName).toBe('IFRAME');
    expect(iframe).toHaveAttribute(
      'src',
      expect.stringContaining(
        '/openmrs/auth?requested_document=/document_images/',
      ),
    );
  });

  it('opens modal with img element when image document link is clicked', async () => {
    const user = userEvent.setup();
    mockedGetDocumentReferencePage.mockResolvedValueOnce(wrapPage([xrayDoc]));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('XRay_Report_2024')).toBeInTheDocument();
    });

    await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const image = screen.getByRole('img', { name: 'XRay_Report_2024' });
    expect(image).toBeInTheDocument();
  });

  it('shows all attachments in modal for a document with multiple content entries', async () => {
    const user = userEvent.setup();
    mockedGetDocumentReferencePage.mockResolvedValueOnce(
      wrapPage([multiAttachmentDoc]),
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('MultiPage_Report_2024')).toBeInTheDocument();
    });

    await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Both attachments rendered as iframes
    const iframes = screen.getAllByTitle('MultiPage_Report_2024');
    expect(iframes).toHaveLength(2);
    // Counter labels visible
    expect(screen.getByText('1/2')).toBeInTheDocument();
    expect(screen.getByText('2/2')).toBeInTheDocument();
  });

  it('closes modal after clicking close button', async () => {
    const user = userEvent.setup();
    mockedGetDocumentReferencePage.mockResolvedValueOnce(
      wrapPage([prescriptionDoc]),
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    });

    await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('passes encounterUuids filter to service when provided', async () => {
    mockedGetDocumentReferencePage.mockResolvedValueOnce(
      wrapPage([prescriptionDoc]),
    );

    const encounterUuids = ['encounter-uuid-1', 'encounter-uuid-2'];
    renderComponent({ encounterUuids });

    await waitFor(() => {
      expect(mockedGetDocumentReferencePage).toHaveBeenCalledWith(
        'test-patient-uuid',
        encounterUuids,
        10,
        undefined,
      );
    });
  });

  it('calls service without encounter filter when encounterUuids is not provided', async () => {
    mockedGetDocumentReferencePage.mockResolvedValueOnce(
      wrapPage([prescriptionDoc]),
    );

    renderComponent();

    await waitFor(() => {
      expect(mockedGetDocumentReferencePage).toHaveBeenCalledWith(
        'test-patient-uuid',
        undefined,
        10,
        undefined,
      );
    });
  });

  it('sorts documents by uploadedOn descending regardless of service response order', async () => {
    // Service returns in ascending order (oldest first) — component must sort descending
    mockedGetDocumentReferencePage.mockResolvedValueOnce(
      wrapPage([
        labDoc, // 2024-01-08 (oldest)
        xrayDoc, // 2024-01-10
        prescriptionDoc, // 2024-01-15 (newest)
      ]),
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    });

    const rows = screen.getAllByRole('row');
    // rows[0] = header; component sorts descending so newest appears first
    expect(rows[1]).toHaveTextContent('Prescription_2024'); // Jan 15 first
    expect(rows[2]).toHaveTextContent('XRay_Report_2024'); // Jan 10 second
    expect(rows[3]).toHaveTextContent('Lab_Result_2024'); // Jan 08 last
  });

  it('places documents with no uploadedOn date at the bottom', async () => {
    const noDateDoc = {
      ...prescriptionDoc,
      id: 'doc-no-date',
      documentIdentifier: 'No_Date_Doc',
      uploadedOn: '',
    };
    mockedGetDocumentReferencePage.mockResolvedValueOnce(
      wrapPage([
        noDateDoc,
        xrayDoc, // 2024-01-10
        prescriptionDoc, // 2024-01-15
      ]),
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    });

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Prescription_2024'); // Jan 15 first
    expect(rows[2]).toHaveTextContent('XRay_Report_2024'); // Jan 10 second
    expect(rows[3]).toHaveTextContent('No_Date_Doc'); // no date last
  });

  it('navigates to page 2 when server provides nextUrl', async () => {
    const user = userEvent.setup();
    const nextPageUrl =
      '/openmrs/ws/fhir2/R4/DocumentReference?patient=test-patient-uuid&_sort=-date&_count=2&_page=2';

    // Page 1: newest 2 docs, server provides nextUrl
    mockedGetDocumentReferencePage.mockResolvedValueOnce({
      documents: [prescriptionDoc, xrayDoc],
      total: 4,
      nextUrl: nextPageUrl,
      prevUrl: undefined,
    });

    // Page 2: older 2 docs
    mockedGetDocumentReferencePage.mockResolvedValueOnce({
      documents: [labDoc, multiAttachmentDoc],
      total: 4,
      nextUrl: undefined,
      prevUrl: '/openmrs/ws/fhir2/R4/DocumentReference?_page=1',
    });

    renderComponent({ config: { ...defaultConfig, pageSize: 2 } });

    await waitFor(() => {
      expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    });

    // Page 1: first two docs visible
    expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    expect(screen.getByText('XRay_Report_2024')).toBeInTheDocument();

    // Navigate to page 2
    await user.click(screen.getByRole('button', { name: /next page/i }));

    await waitFor(() => {
      expect(screen.getByText('Lab_Result_2024')).toBeInTheDocument();
    });

    expect(screen.getByText('MultiPage_Report_2024')).toBeInTheDocument();
    expect(screen.queryByText('Prescription_2024')).not.toBeInTheDocument();
  });

  it('accepts and passes pageSize configuration to SortableDataTable', async () => {
    mockedGetDocumentReferencePage.mockResolvedValueOnce(
      wrapPage([prescriptionDoc, xrayDoc, labDoc]),
    );

    // Render with pageSize configuration
    renderComponent({ config: { ...defaultConfig, pageSize: 2 } });

    await waitFor(() => {
      expect(screen.getByTestId('documents-table')).toBeInTheDocument();
    });

    // Component should render successfully with pageSize config
    const table = screen.getByTestId('documents-table');
    expect(table).toBeInTheDocument();
  });

  it('documents are fetched correctly when pageSize is configured', async () => {
    mockedGetDocumentReferencePage.mockResolvedValueOnce(
      wrapPage([prescriptionDoc, xrayDoc, labDoc]),
    );

    // Render with pageSize=2
    renderComponent({ config: { ...defaultConfig, pageSize: 2 } });

    await waitFor(() => {
      expect(mockedGetDocumentReferencePage).toHaveBeenCalled();
    });

    // Service is called with the configured pageSize
    expect(mockedGetDocumentReferencePage).toHaveBeenCalledWith(
      'test-patient-uuid',
      undefined,
      2,
      undefined,
    );
  });

  it('renders documents correctly without pageSize configuration', async () => {
    mockedGetDocumentReferencePage.mockResolvedValueOnce(
      wrapPage([prescriptionDoc, xrayDoc, labDoc]),
    );

    // Render with default config (no pageSize)
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('documents-table')).toBeInTheDocument();
    });

    // All 3 documents should be fetchable from service
    expect(mockedGetDocumentReferencePage).toHaveBeenCalled();
  });

  it('does not refetch documents when consultation saved for a different patient', async () => {
    let capturedCallback: ((payload: any) => void) | undefined;
    (useSubscribeConsultationSaved as jest.Mock).mockImplementation(
      (cb: (payload: any) => void) => {
        capturedCallback = cb;
      },
    );

    mockedGetDocumentReferencePage.mockResolvedValueOnce(
      wrapPage([prescriptionDoc]),
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    });

    act(() => {
      capturedCallback?.({ patientUUID: 'different-patient-uuid' });
    });

    await act(async () => {});

    expect(mockedGetDocumentReferencePage).toHaveBeenCalledTimes(1);
  });

  it('does not call the API when patientUUID is null', async () => {
    (usePatientUUID as jest.Mock).mockReturnValue(null);
    mockedGetDocumentReferencePage.mockResolvedValueOnce(wrapPage([]));

    renderComponent();

    // Wait a render cycle to ensure no query fires
    await act(async () => {});

    expect(mockedGetDocumentReferencePage).not.toHaveBeenCalled();
  });

  describe('Pagination', () => {
    beforeEach(() => {
      (usePatientUUID as jest.Mock).mockReturnValue('test-patient-uuid');
      mockedGetDocumentReferencePage.mockReset();
    });

    it('renders table with all documents loaded from service regardless of pageSize', async () => {
      mockedGetDocumentReferencePage.mockResolvedValueOnce(
        wrapPage([prescriptionDoc, xrayDoc, labDoc]),
      );

      renderComponent({ config: { ...defaultConfig, pageSize: 10 } });

      await waitFor(() => {
        expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
      });

      expect(screen.getByText('XRay_Report_2024')).toBeInTheDocument();
      expect(screen.getByText('Lab_Result_2024')).toBeInTheDocument();
    });

    it('hides pagination when server total is fewer than or equal to pageSize', async () => {
      mockedGetDocumentReferencePage.mockResolvedValueOnce(
        wrapPage([prescriptionDoc, xrayDoc]),
      );

      renderComponent({ config: { ...defaultConfig, pageSize: 10 } });

      await waitFor(() => {
        expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
      });

      expect(
        screen.queryByRole('button', { name: /next page/i }),
      ).not.toBeInTheDocument();
    });

    it('fetches documents from service with configured pageSize', async () => {
      mockedGetDocumentReferencePage.mockResolvedValueOnce(
        wrapPage([prescriptionDoc, xrayDoc, labDoc]),
      );

      renderComponent({ config: { ...defaultConfig, pageSize: 5 } });

      await waitFor(() => {
        expect(mockedGetDocumentReferencePage).toHaveBeenCalledWith(
          'test-patient-uuid',
          undefined,
          5,
          undefined,
        );
      });
    });

    it('modal still works when pageSize is configured', async () => {
      const user = userEvent.setup();
      mockedGetDocumentReferencePage.mockResolvedValueOnce(
        wrapPage([prescriptionDoc]),
      );

      renderComponent({ config: { ...defaultConfig, pageSize: 10 } });

      await waitFor(() => {
        expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
      });

      await user.click(screen.getByText('DOCUMENTS_VIEW_ATTACHMENTS'));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('renders with default pageSize of 10 when not specified in config', async () => {
      mockedGetDocumentReferencePage.mockResolvedValueOnce(
        wrapPage([prescriptionDoc, xrayDoc]),
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
      });

      expect(screen.getByText('XRay_Report_2024')).toBeInTheDocument();
    });

    it('shows pagination when server total exceeds pageSize', async () => {
      mockedGetDocumentReferencePage.mockResolvedValueOnce({
        documents: [prescriptionDoc, xrayDoc],
        total: 5,
        nextUrl: '/openmrs/ws/fhir2/R4/DocumentReference?_page=2',
        prevUrl: undefined,
      });

      renderComponent({ config: { ...defaultConfig, pageSize: 2 } });

      await waitFor(() => {
        expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
      });

      expect(
        screen.getByRole('button', { name: /next page/i }),
      ).toBeInTheDocument();
    });
  });
});
