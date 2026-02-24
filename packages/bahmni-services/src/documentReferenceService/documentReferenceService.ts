import { Bundle, DocumentReference } from 'fhir/r4';
import { get } from '../api';
import { OPENMRS_FHIR_R4 } from '../constants/app';

/**
 * Builds the DocumentReference query URL with optional encounter filtering
 * @param patientUuid - The patient UUID to fetch documents for
 * @param encounterUuids - Optional array of encounter UUIDs to filter by
 * @returns The complete API URL for fetching documents
 */
const buildDocumentReferenceUrl = (
  patientUuid: string,
  encounterUuids?: string[],
): string => {
  const baseUrl = `${OPENMRS_FHIR_R4}/DocumentReference?patient=${patientUuid}&_sort=-date`;
  if (encounterUuids && encounterUuids.length > 0) {
    const encounterParam = encounterUuids.join(',');
    return `${baseUrl}&encounter=${encounterParam}`;
  }
  return baseUrl;
};

/**
 * Fetches patient documents from the FHIR DocumentReference endpoint
 * Documents are sorted by date (latest first)
 * @param patientUuid - The UUID of the patient to fetch documents for
 * @param encounterUuids - Optional array of encounter UUIDs to filter documents
 * @returns Promise resolving to a FHIR Bundle containing DocumentReference resources
 */
export async function getDocumentReferences(
  patientUuid: string,
  encounterUuids?: string[],
): Promise<Bundle<DocumentReference>> {
  const url = buildDocumentReferenceUrl(patientUuid, encounterUuids);
  return get<Bundle<DocumentReference>>(url);
}
