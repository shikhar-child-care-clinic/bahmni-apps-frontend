import { formatDate } from '@bahmni/services';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { render, screen, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import {
  createQueryClient,
  mockConfig,
  mockDocumentReferenceViewModels,
  mockDocumentReferenceWithMissingValues,
  mockSingleDocumentReference,
  mockDocumentReferenceWithAttachments,
} from '../__mocks__/mocks';
import DocumentReferenceTable from '../DocumentReferenceTable';

expect.extend(toHaveNoViolations);

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  formatDate: jest.fn(),
}));
jest.mock('../../hooks/usePatientUUID');

describe('DocumentReferenceTable', () => {
  const queryClient = createQueryClient();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePatientUUID as jest.Mock).mockReturnValue('patient-123');
    (formatDate as jest.Mock).mockImplementation((date) => ({
      formattedResult: date ? '15/01/2020' : '-',
    }));
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = (
    <QueryClientProvider client={queryClient}>
      <DocumentReferenceTable config={mockConfig} />
    </QueryClientProvider>
  );

  it('should show loading state when data is loading', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      error: null,
      isError: false,
      isLoading: true,
    });
    render(wrapper);
    expect(
      screen.getByTestId('patient-document-reference-table-test-id'),
    ).toBeInTheDocument();
  });

  it('should show error state when an error occurs', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      error: new Error('An unexpected error occurred'),
      isError: true,
      isLoading: false,
    });
    render(wrapper);
    expect(
      screen.getByText('DOCUMENT_REFERENCE_TABLE_ERROR_STATE'),
    ).toBeInTheDocument();
  });

  it('should show empty state when no documents exist', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      error: null,
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    expect(
      screen.getByText('DOCUMENT_REFERENCE_TABLE_EMPTY_STATE'),
    ).toBeInTheDocument();
  });

  it('should display document references correctly', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: mockDocumentReferenceViewModels,
      error: null,
      isError: false,
      isLoading: false,
    });

    render(wrapper);

    expect(
      screen.getByTestId('patient-document-reference-table-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByText('Passport')).toBeInTheDocument();
    expect(screen.getByText('P123456')).toBeInTheDocument();
    expect(screen.getByText('National ID')).toBeInTheDocument();
    expect(screen.getByText('N789012')).toBeInTheDocument();
  });

  it('should handle missing values gracefully', () => {
    const wrapperWithAttributes = (
      <QueryClientProvider client={queryClient}>
        <DocumentReferenceTable
          config={{
            fields: [
              'documentType',
              'masterIdentifier',
              'issuingDate',
              'expiryDate',
              'issuingCountry',
            ],
          }}
        />
      </QueryClientProvider>
    );

    (useQuery as jest.Mock).mockReturnValue({
      data: mockDocumentReferenceWithMissingValues,
      error: null,
      isError: false,
      isLoading: false,
    });

    render(wrapperWithAttributes);

    expect(
      screen.getByTestId('patient-document-reference-table-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByText('Passport')).toBeInTheDocument();
    const dashElements = screen.getAllByText('-');
    expect(dashElements.length).toBeGreaterThan(0);
    expect(
      screen.getByTestId(
        'patient-document-reference-table-issuingCountry-doc-1-test-id',
      ),
    ).toHaveTextContent('-');
  });

  it('should verify table structure', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [mockSingleDocumentReference],
      error: null,
      isError: false,
      isLoading: false,
    });

    render(wrapper);

    expect(
      screen.getByTestId('patient-document-reference-table-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByText('Passport')).toBeInTheDocument();
    expect(screen.getByText('P123456')).toBeInTheDocument();
  });

  it('should render ImageTile, VideoTile, and FileTile based on attachment content type', () => {
    const wrapperWithAttachments = (
      <QueryClientProvider client={queryClient}>
        <DocumentReferenceTable
          config={{
            ...mockConfig,
            fields: ['attachment'],
            hideThumbnail: false,
          }}
        />
      </QueryClientProvider>
    );

    (useQuery as jest.Mock).mockReturnValue({
      data: [mockDocumentReferenceWithAttachments],
      error: null,
      isError: false,
      isLoading: false,
    });

    render(wrapperWithAttachments);

    expect(screen.getByTestId('image-attachment-test-id')).toBeInTheDocument();
    expect(screen.getByTestId('video-attachment-test-id')).toBeInTheDocument();
    expect(screen.getByTestId('file-attachment-test-id')).toBeInTheDocument();
  });

  describe('Snapshot', () => {
    it('should match snapshot with document data', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockSingleDocumentReference],
        error: null,
        isError: false,
        isLoading: false,
      });
      const { container } = render(wrapper);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it('passes accessibility tests with data', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockSingleDocumentReference],
        error: null,
        isError: false,
        isLoading: false,
      });
      const { container } = render(wrapper);
      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });
});
