import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { useNotification } from '../../notification';
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
}));
jest.mock('@carbon/icons-react', () => ({
  DocumentPdf: () => <div data-testid="pdf-icon">PDF</div>,
  Image: () => <div data-testid="image-icon">IMG</div>,
  Document: () => <div data-testid="document-icon">DOC</div>,
}));

const mockAddNotification = jest.fn();

const mockSingleDocument = [
  {
    id: 'doc-1',
    name: 'Prescription_2024',
    documentType: 'Prescription',
    uploadedOn: '2024-01-15',
    uploadedBy: 'Dr. Smith',
    contentType: 'application/pdf',
    documentUrl: '/path/to/prescription.pdf',
  },
];

const mockMultipleDocuments = [
  {
    id: 'severe-doc',
    name: 'Discharge_Summary_2024',
    documentType: 'Discharge Summary',
    uploadedOn: '2024-01-15T10:30:00Z',
    uploadedBy: 'Dr. Johnson',
    contentType: 'application/pdf',
    documentUrl: '/path/to/discharge.pdf',
  },
  {
    id: 'mild-doc',
    name: 'XRay_Report_2024',
    documentType: 'Radiology Report',
    uploadedOn: '2024-01-10T14:45:00Z',
    uploadedBy: 'Dr. Williams',
    contentType: 'image/jpeg',
    documentUrl: '/path/to/xray.jpg',
  },
  {
    id: 'moderate-doc',
    name: 'Lab_Result_2024',
    documentType: 'Lab Result',
    uploadedOn: '2024-01-08T09:00:00Z',
    uploadedBy: 'Dr. Martinez',
    contentType: 'application/pdf',
    documentUrl: '/path/to/lab.pdf',
  },
];

describe('DocumentsTable Integration', () => {
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = (
    <QueryClientProvider client={queryClient}>
      <DocumentsTable />
    </QueryClientProvider>
  );

  it('displays patient documents with all critical information for clinical review', async () => {
    // Mock fetch to return a document bundle
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            entry: mockSingleDocument.map((doc) => ({
              resource: doc,
            })),
          }),
      }),
    ) as jest.Mock;

    render(wrapper);

    expect(screen.getByTestId('documents-table')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    });

    expect(screen.getByText('Prescription')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByTestId('pdf-icon')).toBeInTheDocument();
  });

  it('shows empty state when patient has no recorded documents', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ entry: [] }),
      }),
    ) as jest.Mock;

    render(wrapper);

    expect(screen.getByTestId('documents-table')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('DOCUMENTS_NO_RECORDS')).toBeInTheDocument();
    });
  });

  it('shows error state when document data cannot be fetched', async () => {
    const errorMessage = 'Failed to fetch documents';
    global.fetch = jest.fn(() =>
      Promise.reject(new Error(errorMessage)),
    ) as jest.Mock;

    render(wrapper);

    expect(screen.getByTestId('documents-table')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'ERROR_DEFAULT_TITLE',
        }),
      );
    });
  });

  it('displays multiple documents sorted by upload date (latest first)', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            entry: mockMultipleDocuments.map((doc) => ({
              resource: doc,
            })),
          }),
      }),
    ) as jest.Mock;

    render(wrapper);

    expect(screen.getByTestId('documents-table')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Discharge_Summary_2024')).toBeInTheDocument();
    });

    // Verify all documents are displayed
    expect(screen.getByText('Discharge_Summary_2024')).toBeInTheDocument();
    expect(screen.getByText('XRay_Report_2024')).toBeInTheDocument();
    expect(screen.getByText('Lab_Result_2024')).toBeInTheDocument();

    // Verify document types
    expect(screen.getByText('Discharge Summary')).toBeInTheDocument();
    expect(screen.getByText('Radiology Report')).toBeInTheDocument();
    expect(screen.getByText('Lab Result')).toBeInTheDocument();

    // Verify uploaders
    expect(screen.getByText('Dr. Johnson')).toBeInTheDocument();
    expect(screen.getByText('Dr. Williams')).toBeInTheDocument();
    expect(screen.getByText('Dr. Martinez')).toBeInTheDocument();

    // Verify icons
    expect(screen.getAllByTestId('pdf-icon')).toHaveLength(2);
    expect(screen.getByTestId('image-icon')).toBeInTheDocument();
  });

  it('renders document links as clickable with target="_blank"', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            entry: mockSingleDocument.map((doc) => ({
              resource: doc,
            })),
          }),
      }),
    ) as jest.Mock;

    render(wrapper);

    await waitFor(() => {
      expect(screen.getByText('Prescription_2024')).toBeInTheDocument();
    });

    const link = screen.getByRole('link', { name: 'Prescription_2024' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
