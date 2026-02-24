import { type DocumentReference } from '@bahmni/services';
import { DocumentViewModel } from './models';

/**
 * Maps FHIR DocumentReference resources to DocumentViewModel for table display
 * @param entries - Array of DocumentReference bundle entries
 * @returns Array of DocumentViewModel view models ready for table rendering
 */
export function mapDocumentReferencesToViewModels(
  entries: Array<{ resource: DocumentReference }>,
): DocumentViewModel[] {
  return entries
    .filter((entry) => entry.resource && entry.resource.resourceType === 'DocumentReference')
    .map((entry) => {
      const doc = entry.resource as DocumentReference;
      const attachment = doc.content?.[0]?.attachment;
      const masterIdentifier = doc.masterIdentifier?.value || doc.id || '';

      return {
        id: doc.id!,
        name: masterIdentifier,
        documentType: doc.type?.coding?.[0]?.display || doc.category?.[0]?.coding?.[0]?.display,
        uploadedOn: doc.date || '',
        uploadedBy: doc.author?.[0]?.display,
        contentType: attachment?.contentType,
        documentUrl: attachment?.url || '',
      };
    });
}

/**
 * Determines the file type category from content type MIME string
 * @param contentType - The MIME type of the document
 * @returns File type category: 'pdf', 'image', or 'document'
 */
export function getFileTypeCategory(
  contentType?: string,
): 'pdf' | 'image' | 'document' {
  if (!contentType) {
    return 'document';
  }

  const lowerContentType = contentType.toLowerCase();

  if (lowerContentType.includes('pdf')) {
    return 'pdf';
  }

  if (lowerContentType.includes('image')) {
    return 'image';
  }

  return 'document';
}

/**
 * Builds the full document URL for opening in a new tab
 * Handles both relative and absolute URLs
 * @param documentUrl - The document URL from DocumentReference
 * @returns Full URL ready for browser navigation
 */
export function buildDocumentUrl(documentUrl: string): string {
  if (!documentUrl) {
    return '#';
  }

  // If already absolute URL (http/https), return as-is
  if (documentUrl.startsWith('http://') || documentUrl.startsWith('https://')) {
    return documentUrl;
  }

  // If relative path, prepend base path
  if (documentUrl.startsWith('/')) {
    return documentUrl;
  }

  // Default: assume it's a path that needs the OpenMRS base
  return `/openmrs/ws/fhir2/R4/Binary/${documentUrl}`;
}
