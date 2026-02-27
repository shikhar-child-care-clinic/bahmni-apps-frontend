import { getDocumentReferencesByPatient } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { DocumentReference } from 'fhir/r4';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import DocumentReferenceTable from '../DocumentReferenceTable';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getDocumentReferencesByPatient: jest.fn(),
}));
jest.mock('../../hooks/usePatientUUID');

describe('DocumentReferenceTable Integration', () => {
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

  const mockConfig = {
    fields: ['documentType', 'masterIdentifier', 'issuingDate', 'expiryDate'],
  };

  const mockDocumentReferences: DocumentReference[] = [
    {
      resourceType: 'DocumentReference',
      id: 'doc-1',
      status: 'current',
      type: {
        text: 'Passport',
      },
      masterIdentifier: {
        value: 'P123456',
      },
      context: {
        period: {
          start: '2020-01-15T00:00:00.000Z',
          end: '2030-01-15T00:00:00.000Z',
        },
      },
      content: [
        {
          attachment: {
            contentType: 'application/pdf',
          },
        },
      ],
    },
    {
      resourceType: 'DocumentReference',
      id: 'doc-2',
      status: 'current',
      type: {
        text: 'National ID',
      },
      masterIdentifier: {
        value: 'N789012',
      },
      context: {
        period: {
          start: '2019-05-10T00:00:00.000Z',
          end: '2029-05-10T00:00:00.000Z',
        },
      },
      content: [
        {
          attachment: {
            contentType: 'application/pdf',
          },
        },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (usePatientUUID as jest.Mock).mockReturnValue('patient-123');
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch and display document references correctly', async () => {
    (getDocumentReferencesByPatient as jest.Mock).mockResolvedValue(
      mockDocumentReferences,
    );

    render(
      <QueryClientProvider client={queryClient}>
        <DocumentReferenceTable config={mockConfig} />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('patient-document-reference-table-test-id'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(
          'patient-document-reference-table-documentType-doc-1-test-id',
        ),
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Passport')).toBeInTheDocument();
    expect(screen.getByText('P123456')).toBeInTheDocument();
    expect(screen.getByText('National ID')).toBeInTheDocument();
    expect(screen.getByText('N789012')).toBeInTheDocument();

    expect(getDocumentReferencesByPatient).toHaveBeenCalledTimes(1);
    expect(getDocumentReferencesByPatient).toHaveBeenCalledWith('patient-123');
  });

  it('should show error state when an error occurs', async () => {
    const errorMessage = 'Failed to fetch document references from server';
    (getDocumentReferencesByPatient as jest.Mock).mockRejectedValue(
      new Error(errorMessage),
    );

    render(
      <QueryClientProvider client={queryClient}>
        <DocumentReferenceTable config={mockConfig} />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText('DOCUMENT_REFERENCE_TABLE_ERROR_STATE'),
      ).toBeInTheDocument();
    });
  });
});
