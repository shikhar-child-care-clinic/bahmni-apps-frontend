import { Bundle, DocumentReference } from 'fhir/r4';
import { get } from '../api';
import { PATIENT_DOCUMENT_REFERENCES_URL } from './constants';
import { DocumentViewModel } from './models';

/**
 * Maps FHIR DocumentReference entries to DocumentViewModel for UI consumption
 * @param entries - Array of FHIR Bundle entries containing DocumentReference resources
 * @returns Array of formatted DocumentViewModel objects
 */
function mapDocumentReferencesToViewModels(
  entries: Array<{ resource: DocumentReference }>,
): DocumentViewModel[] {
  return entries
    .filter((entry) => entry.resource?.resourceType === 'DocumentReference')
    .map((entry) => {
      const doc = entry.resource;
      const masterIdentifier = doc.masterIdentifier?.value ?? doc.id ?? '';

      const attachments = (doc.content ?? [])
        .map((c) => c.attachment)
        .filter((a): a is NonNullable<typeof a> => !!a)
        .map((a) => ({ url: a.url ?? '', contentType: a.contentType }));

      const firstAttachment = attachments[0];

      return {
        id: doc.id ?? masterIdentifier,
        documentIdentifier: masterIdentifier,
        documentType:
          doc.type?.coding?.[0]?.display ??
          doc.category?.[0]?.coding?.[0]?.display,
        uploadedOn: doc.date ?? doc.context?.period?.start ?? '',
        uploadedBy: doc.author?.[0]?.display,
        contentType: firstAttachment?.contentType,
        documentUrl: firstAttachment?.url ?? '',
        attachments,
      };
    });
}

/**
 * Fetches patient documents from the FHIR DocumentReference endpoint
 * The request includes _sort=-date; actual ordering depends on server support.
 * @param patientUuid - The UUID of the patient to fetch documents for
 * @param encounterUuids - Optional array of encounter UUIDs to filter documents
 * @returns Promise resolving to a FHIR Bundle containing DocumentReference resources
 */
export async function getDocumentReferences(
  patientUuid: string,
  encounterUuids?: string[],
): Promise<Bundle<DocumentReference>> {
  const url = PATIENT_DOCUMENT_REFERENCES_URL(patientUuid, encounterUuids);
  return get<Bundle<DocumentReference>>(url);
}

/**
 * Fetches and formats patient documents from the FHIR DocumentReference endpoint
 * Returns documents transformed to DocumentViewModel; consumers are responsible
 * for client-side sorting where server-side _sort=-date is unsupported.
 * @param patientUuid - The UUID of the patient to fetch documents for
 * @param encounterUuids - Optional array of encounter UUIDs to filter documents
 * @returns Promise resolving to an array of formatted DocumentViewModel objects
 */
export async function getFormattedDocumentReferences(
  patientUuid: string,
  encounterUuids?: string[],
): Promise<DocumentViewModel[]> {
  const bundle = await getDocumentReferences(patientUuid, encounterUuids);
  const entries = (bundle.entry ?? []).filter(
    (entry): entry is { resource: DocumentReference } => !!entry.resource,
  );
  return mapDocumentReferencesToViewModels(entries);
}

export interface DocumentReferencePage {
  documents: DocumentViewModel[];
  total: number;
  nextUrl?: string;
  prevUrl?: string;
}

/**
 * Fetches a single page of patient documents from the FHIR DocumentReference endpoint.
 * Supports server-side pagination via FHIR Bundle link relations (next/previous).
 * @param patientUuid - The UUID of the patient to fetch documents for
 * @param encounterUuids - Optional array of encounter UUIDs to filter documents
 * @param count - Number of items per page (default 10)
 * @param pageUrl - If provided, fetch this URL directly (for next/prev navigation)
 * @returns Promise resolving to a DocumentReferencePage with documents and pagination info
 */
export async function getDocumentReferencePage(
  patientUuid: string,
  encounterUuids?: string[],
  count?: number,
  pageUrl?: string,
): Promise<DocumentReferencePage> {
  let url: string;
  if (pageUrl) {
    // The FHIR server embeds its own hostname in link URLs (e.g. http://localhost/...).
    // Strip the hostname and use only pathname + search so Axios resolves it against
    // the actual server configured in the client, not the server's internal hostname.
    try {
      const parsed = new URL(pageUrl);
      url = parsed.pathname + parsed.search;
    } catch {
      url = pageUrl;
    }
  } else {
    url = PATIENT_DOCUMENT_REFERENCES_URL(patientUuid, encounterUuids, count);
  }
  const bundle = await get<Bundle<DocumentReference>>(url);

  const entries = (bundle.entry ?? []).filter(
    (entry): entry is { resource: DocumentReference } => !!entry.resource,
  );

  const nextUrl = bundle.link?.find((l) => l.relation === 'next')?.url;
  const prevUrl = bundle.link?.find((l) => l.relation === 'previous')?.url;

  return {
    documents: mapDocumentReferencesToViewModels(entries),
    total: bundle.total ?? entries.length,
    nextUrl,
    prevUrl,
  };
}
