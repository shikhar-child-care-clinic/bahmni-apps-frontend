import { OPENMRS_FHIR_R4, OPENMRS_REST_V1 } from '../constants/app';

export const PATIENT_MEDICATION_RESOURCE_URL = (
  patientUUID: string,
  isVaccinationType?: boolean,
  encounterUuids?: string,
) => {
  const baseUrl =
    OPENMRS_FHIR_R4 + '/MedicationRequest?_sort=-_lastUpdated&_count=100';
  let url = `${baseUrl}&patient=${patientUUID}`;

  if (isVaccinationType) {
    url += `&code=http://hl7.org/fhir/sid/cvx|`;
  }

  if (encounterUuids) {
    url += `&encounter=${encounterUuids}`;
  }
  return url;
};

export const MEDICATION_ORDERS_METADATA_URL =
  OPENMRS_REST_V1 + '/bahmnicore/config/drugOrders';

export const MEDICATIONS_SEARCH_URL = (searchTerm: string, count: number) =>
  OPENMRS_FHIR_R4 +
  `/Medication?name=${encodeURIComponent(searchTerm)}&_count=${count}`;

export const VACCINES_URL =
  OPENMRS_FHIR_R4 + '/Medication?code=http://hl7.org/fhir/sid/cvx|';
