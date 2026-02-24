import { type DocumentReference } from '@bahmni/services';
import {
  mapDocumentReferencesToViewModels,
  getFileTypeCategory,
  buildDocumentUrl,
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
                system: 'http://snomed.info/sct',
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
          name: 'Prescription_2024',
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

      expect(result[0].name).toBe('doc-2');
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
          name: 'Document_3',
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
            content: [{ attachment: { contentType: 'application/pdf', url: '/doc1' } }],
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
      expect(result[0].name).toBe('Doc 1');
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

    it('returns image category for image content types', () => {
      const jpegCategory = getFileTypeCategory('image/jpeg');
      expect(jpegCategory).toBe('image');

      const pngCategory = getFileTypeCategory('image/png');
      expect(pngCategory).toBe('image');
    });

    it('returns document category for unknown content types', () => {
      const category = getFileTypeCategory('application/msword');
      expect(category).toBe('document');
    });

    it('returns document category when content type is undefined', () => {
      const category = getFileTypeCategory(undefined);
      expect(category).toBe('document');
    });

    it('handles case-insensitive content types', () => {
      const upperCasePdf = getFileTypeCategory('APPLICATION/PDF');
      expect(upperCasePdf).toBe('pdf');

      const mixedCaseImage = getFileTypeCategory('Image/JPEG');
      expect(mixedCaseImage).toBe('image');
    });
  });

  describe('buildDocumentUrl', () => {
    it('returns absolute HTTP URL as-is', () => {
      const url = buildDocumentUrl('https://example.com/document.pdf');
      expect(url).toBe('https://example.com/document.pdf');
    });

    it('returns absolute HTTPS URL as-is', () => {
      const url = buildDocumentUrl('https://example.com/document.pdf');
      expect(url).toBe('https://example.com/document.pdf');
    });

    it('returns relative path starting with / as-is', () => {
      const url = buildDocumentUrl('/openmrs/ws/fhir2/R4/Binary/123');
      expect(url).toBe('/openmrs/ws/fhir2/R4/Binary/123');
    });

    it('prepends OpenMRS Binary endpoint for non-absolute paths', () => {
      const url = buildDocumentUrl('document-id-123');
      expect(url).toBe('/openmrs/ws/fhir2/R4/Binary/document-id-123');
    });

    it('returns # for empty URL', () => {
      const url = buildDocumentUrl('');
      expect(url).toBe('#');
    });

    it('handles HTTP URLs', () => {
      const url = buildDocumentUrl('http://example.com/document.pdf');
      expect(url).toBe('http://example.com/document.pdf');
    });
  });
});
