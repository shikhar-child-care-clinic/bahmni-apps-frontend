import { QueryClient } from '@tanstack/react-query';
import { DocumentReference } from 'fhir/r4';
import { DocumentReferenceViewModel } from '../models';

export const createMockDocumentReference = (
  overrides?: Partial<DocumentReference>,
): DocumentReference => ({
  resourceType: 'DocumentReference',
  id: 'doc-123',
  status: 'current',
  content: [],
  type: {
    text: 'Passport',
    coding: [
      {
        code: 'passport',
        display: 'Passport',
      },
    ],
  },
  masterIdentifier: {
    value: 'ABC123456',
  },
  extension: [
    {
      url: 'https://fhir.bahmni.org/ext/document-reference/attribute#issuing-country',
      valueString: 'USA',
    },
  ],
  context: {
    period: {
      start: '2020-01-15T00:00:00.000Z',
      end: '2030-01-15T00:00:00.000Z',
    },
  },
  ...overrides,
});

export const mockDocumentReferenceViewModels: DocumentReferenceViewModel[] = [
  {
    id: 'doc-1',
    documentType: 'Passport',
    masterIdentifier: 'P123456',
    issuingDate: new Date('2020-01-15T00:00:00.000Z'),
    expiryDate: new Date('2030-01-15T00:00:00.000Z'),
    attributes: { issuingCountry: 'USA' },
    attachment: [{ contentType: 'application/pdf' }],
  },
  {
    id: 'doc-2',
    documentType: 'National ID',
    masterIdentifier: 'N789012',
    issuingDate: new Date('2019-05-10T00:00:00.000Z'),
    expiryDate: new Date('2029-05-10T00:00:00.000Z'),
    attributes: {},
    attachment: [{ contentType: 'application/pdf' }],
  },
];

export const mockDocumentReferenceWithMissingValues: DocumentReferenceViewModel[] =
  [
    {
      id: 'doc-1',
      documentType: 'Passport',
      masterIdentifier: 'P123456',
      issuingDate: null,
      expiryDate: null,
      attributes: {},
      attachment: [],
    },
    {
      id: 'doc-2',
      documentType: '',
      masterIdentifier: '',
      issuingDate: new Date('2019-05-10T00:00:00.000Z'),
      expiryDate: null,
      attributes: { issuingCountry: null },
      attachment: [{ contentType: 'application/pdf' }],
    },
  ];

export const mockSingleDocumentReference: DocumentReferenceViewModel = {
  id: 'doc-1',
  documentType: 'Passport',
  masterIdentifier: 'P123456',
  issuingDate: new Date('2020-01-15T00:00:00.000Z'),
  expiryDate: new Date('2030-01-15T00:00:00.000Z'),
  attributes: { issuingCountry: 'USA' },
  attachment: [{ contentType: 'application/pdf' }],
};

export const mockDocumentReferences: DocumentReference[] = [
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

export const mockConfig = {
  fields: ['documentType', 'masterIdentifier', 'issuingDate', 'expiryDate'],
};

export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
