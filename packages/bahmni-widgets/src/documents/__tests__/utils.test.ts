import { type DocumentReference } from '@bahmni/services';
import {
  mapDocumentReferencesToViewModels,
  getFileTypeCategory,
  buildDocumentUrl,
  createDocumentHeaders,
} from '../utils';

describe('Documents Utils', () => {
  describe('mapDocumentReferencesToViewModels', () => {
    it('transforms FHIR DocumentReference bundle entries to view models', () => {
      const mockEntry = {
        resource: {
          resourceType: 'DocumentReference' as const,
          id: 'doc-1',
          masterIdentifier: {
            value: 'Prescription_2024',
          },
          type: {
            coding: [
              {
                system: 'https://snomed.info/sct',
                code: '16076005',
                display: 'Prescription',
              },
            ],
          },
          date: '2024-01-15T10:30:00Z',
          author: [
            {
              display: 'Dr. Smith',
            },
          ],
          content: [
            {
              attachment: {
                contentType: 'application/pdf',
                url: '/path/to/document.pdf',
              },
            },
          ],
        } as DocumentReference,
      };

      const result = mapDocumentReferencesToViewModels([mockEntry]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'doc-1',
          documentIdentifier: 'Prescription_2024',
          documentType: 'Prescription',
          uploadedOn: '2024-01-15T10:30:00Z',
          uploadedBy: 'Dr. Smith',
          contentType: 'application/pdf',
          documentUrl: '/path/to/document.pdf',
        }),
      );
    });

    it('handles missing masterIdentifier by using resource id', () => {
      const mockEntry = {
        resource: {
          resourceType: 'DocumentReference' as const,
          id: 'doc-2',
          masterIdentifier: undefined,
          date: '2024-01-15T10:30:00Z',
          content: [
            {
              attachment: {
                contentType: 'application/pdf',
                url: '/path/to/document.pdf',
              },
            },
          ],
        } as DocumentReference,
      };

      const result = mapDocumentReferencesToViewModels([mockEntry]);

      expect(result[0].documentIdentifier).toBe('doc-2');
    });

    it('uses category coding display when type coding is absent', () => {
      const mockEntry = {
        resource: {
          resourceType: 'DocumentReference' as const,
          id: 'doc-cat',
          masterIdentifier: { value: 'CatDoc' },
          date: '2024-01-15T10:30:00Z',
          category: [
            {
              coding: [{ display: 'Radiology' }],
            },
          ],
          content: [
            {
              attachment: { contentType: 'image/jpeg', url: '/xray.jpg' },
            },
          ],
        } as DocumentReference,
      };

      const result = mapDocumentReferencesToViewModels([mockEntry]);

      expect(result[0].documentType).toBe('Radiology');
    });

    it('handles missing optional fields gracefully', () => {
      const mockEntry = {
        resource: {
          resourceType: 'DocumentReference' as const,
          id: 'doc-3',
          masterIdentifier: {
            value: 'Document_3',
          },
          date: '2024-01-15T10:30:00Z',
          author: undefined,
          type: undefined,
          content: [
            {
              attachment: {
                contentType: 'application/pdf',
                url: '/path/to/document.pdf',
              },
            },
          ],
        } as DocumentReference,
      };

      const result = mapDocumentReferencesToViewModels([mockEntry]);

      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'doc-3',
          documentIdentifier: 'Document_3',
          documentType: undefined,
          uploadedBy: undefined,
        }),
      );
    });

    it('filters out non-DocumentReference resources', () => {
      const mixedEntries = [
        {
          resource: {
            resourceType: 'DocumentReference' as const,
            id: 'doc-1',
            masterIdentifier: { value: 'Doc 1' },
            date: '2024-01-15T10:30:00Z',
            content: [
              { attachment: { contentType: 'application/pdf', url: '/doc1' } },
            ],
          } as DocumentReference,
        },
        {
          resource: {
            resourceType: 'Observation',
            id: 'obs-1',
          },
        },
      ];

      const result = mapDocumentReferencesToViewModels(mixedEntries as any);

      expect(result).toHaveLength(1);
      expect(result[0].documentIdentifier).toBe('Doc 1');
    });

    it('uses empty string for documentUrl when attachment url is absent', () => {
      const mockEntry = {
        resource: {
          resourceType: 'DocumentReference' as const,
          id: 'doc-no-url',
          masterIdentifier: { value: 'NoUrl' },
          date: '2024-01-15T10:30:00Z',
          content: [
            {
              attachment: { contentType: 'application/pdf' },
            },
          ],
        } as DocumentReference,
      };

      const result = mapDocumentReferencesToViewModels([mockEntry]);

      expect(result[0].documentUrl).toBe('');
    });

    it('handles empty entry array', () => {
      const result = mapDocumentReferencesToViewModels([]);

      expect(result).toEqual([]);
    });
  });

  describe('getFileTypeCategory', () => {
    it('returns pdf category for PDF content type', () => {
      const category = getFileTypeCategory('application/pdf');
      expect(category).toBe('pdf');
    });

    it('returns image category for image/jpeg content type', () => {
      expect(getFileTypeCategory('image/jpeg')).toBe('image');
    });

    it('returns image category for image/png content type', () => {
      expect(getFileTypeCategory('image/png')).toBe('image');
    });

    it('returns document category for unknown content types', () => {
      const category = getFileTypeCategory('application/msword');
      expect(category).toBe('document');
    });

    it('returns document category when content type is undefined', () => {
      const category = getFileTypeCategory(undefined);
      expect(category).toBe('document');
    });

    it('handles case-insensitive content types for PDF', () => {
      expect(getFileTypeCategory('APPLICATION/PDF')).toBe('pdf');
    });

    it('handles case-insensitive content types for images', () => {
      expect(getFileTypeCategory('Image/JPEG')).toBe('image');
    });
  });

  describe('buildDocumentUrl', () => {
    const DOCUMENT_AUTH_ENDPOINT =
      '/openmrs/auth?requested_document=/document_images/';

    it.each([
      ['', '#'],
      ['https://example.com/doc.pdf', '#'],
      ['http://example.com/doc.pdf', '#'],
      [['java', 'script', ':alert(1)'].join(''), '#'],
      [['data', ':', 'text/html'].join(''), '#'],
      ['/path/doc.pdf', `${DOCUMENT_AUTH_ENDPOINT}/path/doc.pdf`],
      ['100/filename.pdf', `${DOCUMENT_AUTH_ENDPOINT}100/filename.pdf`],
      [
        '100/12-Patient Document-uuid.png',
        `${DOCUMENT_AUTH_ENDPOINT}100/12-Patient Document-uuid.png`,
      ],
    ])('buildDocumentUrl(%s) returns %s', (input, expected) => {
      expect(buildDocumentUrl(input)).toBe(expected);
    });
  });

  describe('createDocumentHeaders', () => {
    const mockT = (key: string) => key;

    it('returns header objects with key and translated header for each field', () => {
      const fields = [
        'documentIdentifier',
        'documentType',
        'uploadedOn',
        'uploadedBy',
      ];

      const result = createDocumentHeaders(fields, mockT);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({
        key: 'documentIdentifier',
        header: 'DOCUMENTS_DOCUMENT_IDENTIFIER',
      });
      expect(result[1]).toEqual({
        key: 'documentType',
        header: 'DOCUMENTS_TYPE',
      });
      expect(result[2]).toEqual({
        key: 'uploadedOn',
        header: 'DOCUMENTS_UPLOADED_ON',
      });
      expect(result[3]).toEqual({
        key: 'uploadedBy',
        header: 'DOCUMENTS_UPLOADED_BY',
      });
    });

    it('returns empty array when fields is empty', () => {
      const result = createDocumentHeaders([], mockT);

      expect(result).toEqual([]);
    });

    it('uses the translation function to generate the header label', () => {
      const translationFn = jest.fn((key: string) => `translated:${key}`);
      const fields = ['documentIdentifier'];

      const result = createDocumentHeaders(fields, translationFn);

      expect(translationFn).toHaveBeenCalledWith(
        'DOCUMENTS_DOCUMENT_IDENTIFIER',
      );
      expect(result[0].header).toBe('translated:DOCUMENTS_DOCUMENT_IDENTIFIER');
    });

    it('converts camelCase field names to SCREAMING_SNAKE_CASE i18n keys', () => {
      const fields = ['uploadedOn'];

      const result = createDocumentHeaders(fields, mockT);

      expect(result[0]).toEqual({
        key: 'uploadedOn',
        header: 'DOCUMENTS_UPLOADED_ON',
      });
    });
  });
});
