import { type DocumentReference } from '@bahmni/services';
import { DocumentViewModel } from './models';

const DOCUMENT_FIELD_I18N_KEYS: Record<string, string> = {
  documentIdentifier: 'DOCUMENTS_DOCUMENT_IDENTIFIER',
  documentType: 'DOCUMENTS_TYPE',
  uploadedOn: 'DOCUMENTS_UPLOADED_ON',
  uploadedBy: 'DOCUMENTS_UPLOADED_BY',
};

export function mapDocumentReferencesToViewModels(
  entries: Array<{ resource: DocumentReference }>,
): DocumentViewModel[] {
  return entries
    .filter((entry) => entry.resource?.resourceType === 'DocumentReference')
    .map((entry) => {
      const doc = entry.resource;
      const attachment = doc.content?.[0]?.attachment;
      const masterIdentifier = doc.masterIdentifier?.value ?? doc.id ?? '';

      return {
        id: doc.id ?? masterIdentifier,
        documentIdentifier: masterIdentifier,
        documentType:
          doc.type?.coding?.[0]?.display ??
          doc.category?.[0]?.coding?.[0]?.display,
        uploadedOn: doc.date ?? '',
        uploadedBy: doc.author?.[0]?.display,
        contentType: attachment?.contentType,
        documentUrl: attachment?.url ?? '',
      };
    });
}

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

export function buildDocumentUrl(documentUrl: string): string {
  if (!documentUrl || documentUrl.includes(':')) return '#';

  return `/openmrs/auth?requested_document=/document_images/${documentUrl}`;
}

export function createDocumentHeaders(
  fields: string[],
  t: (key: string) => string,
): Array<{ key: string; header: string }> {
  return fields.map((field) => ({
    key: field,
    header: t(DOCUMENT_FIELD_I18N_KEYS[field]),
  }));
}
