import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { render, screen, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useNotification } from '../../notification';
import DocumentsTable from '../DocumentsTable';

expect.extend(toHaveNoViolations);

jest.mock('../../notification');
jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
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

const mockDocument = {
  id: 'doc-1',
  name: 'Test Document',
  documentType: 'Prescription',
  uploadedOn: '2024-01-15',
  uploadedBy: 'Dr. Smith',
  contentType: 'application/pdf',
  documentUrl: '/path/to/document',
};

const mockDocumentWithImage = {
  id: 'doc-2',
  name: 'X-Ray Image',
  documentType: 'Radiology Report',
  uploadedOn: '2024-01-14',
  uploadedBy: 'Dr. Johnson',
  contentType: 'image/jpeg',
  documentUrl: '/path/to/image',
};

describe('DocumentsTable', () => {
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
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

  describe('Component States', () => {
    it('displays loading state', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: null,
        error: null,
        isError: false,
        isLoading: true,
        refetch: jest.fn(),
      });

      render(wrapper);

      expect(screen.getByTestId('documents-table')).toBeInTheDocument();
    });

    it('displays error state with error message', () => {
      const errorMessage = 'Network error';
      (useQuery as jest.Mock).mockReturnValue({
        data: null,
        error: new Error(errorMessage),
        isError: true,
        isLoading: false,
        refetch: jest.fn(),
      });

      render(wrapper);

      expect(screen.getByTestId('documents-table')).toBeInTheDocument();
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'ERROR_DEFAULT_TITLE',
        message: errorMessage,
      });
    });

    it('displays empty state when no documents', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      render(wrapper);

      expect(screen.getByTestId('documents-table')).toBeInTheDocument();
      expect(screen.getByText('DOCUMENTS_NO_RECORDS')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('renders table with headers when documents exist', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockDocument],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      render(wrapper);

      expect(screen.getByRole('table')).toHaveAttribute(
        'aria-label',
        'DOCUMENTS_TABLE_HEADING',
      );
      expect(screen.getByText('DOCUMENTS_NAME')).toBeInTheDocument();
      expect(screen.getByText('DOCUMENTS_DOCUMENT_TYPE')).toBeInTheDocument();
      expect(screen.getByText('DOCUMENTS_UPLOADED_ON')).toBeInTheDocument();
      expect(screen.getByText('DOCUMENTS_UPLOADED_BY')).toBeInTheDocument();
    });

    it('displays document information correctly', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockDocument],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      render(wrapper);

      expect(screen.getByText('Test Document')).toBeInTheDocument();
      expect(screen.getByText('Prescription')).toBeInTheDocument();
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    it('displays multiple documents', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockDocument, mockDocumentWithImage],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      render(wrapper);

      expect(screen.getByText('Test Document')).toBeInTheDocument();
      expect(screen.getByText('X-Ray Image')).toBeInTheDocument();
      expect(screen.getByText('Prescription')).toBeInTheDocument();
      expect(screen.getByText('Radiology Report')).toBeInTheDocument();
    });

    it('renders clickable document name links', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockDocument],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      render(wrapper);

      const link = screen.getByRole('link', { name: 'Test Document' });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('File Type Icons', () => {
    it('displays PDF icon for PDF documents', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockDocument],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      render(wrapper);

      expect(screen.getByTestId('pdf-icon')).toBeInTheDocument();
    });

    it('displays image icon for image documents', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockDocumentWithImage],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      render(wrapper);

      expect(screen.getByTestId('image-icon')).toBeInTheDocument();
    });
  });

  describe('Fallback Content', () => {
    it('displays fallback text when document type is missing', () => {
      const docWithoutType = { ...mockDocument, documentType: undefined };
      (useQuery as jest.Mock).mockReturnValue({
        data: [docWithoutType],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      render(wrapper);

      expect(screen.getByText('DOCUMENTS_NOT_AVAILABLE')).toBeInTheDocument();
    });

    it('displays fallback text when uploaded by is missing', () => {
      const docWithoutUploader = { ...mockDocument, uploadedBy: undefined };
      (useQuery as jest.Mock).mockReturnValue({
        data: [docWithoutUploader],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      render(wrapper);

      const fallbackTexts = screen.getAllByText('DOCUMENTS_NOT_AVAILABLE');
      expect(fallbackTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('passes accessibility tests with data', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockDocument, mockDocumentWithImage],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      const { container } = render(wrapper);

      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    it('passes accessibility tests in empty state', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [],
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      });

      const { container } = render(wrapper);

      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });
});
