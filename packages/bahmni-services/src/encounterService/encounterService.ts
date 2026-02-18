import { Observation,Encounter, Bundle } from 'fhir/r4';
import { get } from '../api';
import { PATIENT_VISITS_URL } from './constants';
import { OPENMRS_FHIR_R4 } from '../constants/app';

/**
 * Fetches visits for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a FhirEncounterBundle
 */
export async function getPatientVisits(
  patientUUID: string,
): Promise<Bundle<Encounter>> {
  return await get<Bundle<Encounter>>(PATIENT_VISITS_URL(patientUUID));
}

/**
 * Fetches and transforms visits for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of FhirEncounter
 */
export async function getVisits(patientUUID: string): Promise<Encounter[]> {
  const fhirEncounterBundle = await getPatientVisits(patientUUID);
  return (
    fhirEncounterBundle.entry
      ?.map((entry) => entry.resource)
      .filter((resource): resource is Encounter => resource !== undefined) ?? []
  );
}

/**
 * Gets the active visit for a patient (encounter with no end date)
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to the current FhirEncounter or null if not found
 */
export async function getActiveVisit(
  patientUUID: string,
): Promise<Encounter | null> {
  const encounters = await getVisits(patientUUID);
  return encounters.find((encounter) => !encounter.period?.end) ?? null;
}

/**
 * Fetch observations by encounter UUID from FHIR API
 * Handles pagination by fetching all pages and combining results
 * @param encounterUUID - Encounter UUID
 * @returns Promise resolving to FHIR observation bundle with all entries from all pages
 */
export async function getFormsDataByEncounterUuid(
  encounterUUID: string,
): Promise<Bundle<Observation>> {
  const url = `${OPENMRS_FHIR_R4}/Observation?encounter=${encounterUUID}`;
  const allEntries: Bundle<Observation>['entry'] = [];
  let nextUrl: string | undefined = url;

  // Helper to normalize URLs and add port if missing
  const normalizeUrl = (urlString: string): string => {
    if (urlString.includes('localhost') && !urlString.includes('localhost:')) {
      return urlString.replace('localhost', 'localhost:3000');
    }
    return urlString;
  };

  // Fetch all pages following the "next" links
  while (nextUrl) {
    const normalizedUrl = normalizeUrl(nextUrl);
    const bundle: Bundle<Observation> = await get<Bundle<Observation>>(normalizedUrl);
    if (bundle.entry) {
      allEntries.push(...bundle.entry);
    }
    // Get the next page URL from the bundle links
    nextUrl = bundle.link?.find((link: { relation?: string; url?: string }) => link.relation === 'next')?.url;
  }

  // Return a combined bundle with all entries
  return {
    resourceType: 'Bundle',
    type: 'searchset',
    total: allEntries.length,
    entry: allEntries,
  } as Bundle<Observation>;
}
