import { OPENMRS_FHIR_R4 } from '../constants/app';

export const FHIR_LAB_ORDER_CONCEPT_TYPE_EXTENSION_URL =
  'http://fhir.bahmni.org/ext/lab-order-concept-type';

export const LAB_INVESTIGATION_URL = (
  category: string,
  patientUuid: string,
  encounterUuids?: string,
  numberOfVisits?: number,
) => {
  const baseUrl =
    OPENMRS_FHIR_R4 + '/ServiceRequest?_sort=-_lastUpdated&_count=100';
  let url = `${baseUrl}&category=${category}&patient=${patientUuid}`;

  if (encounterUuids) {
    url += `&encounter=${encounterUuids}`;
  } else if (numberOfVisits) {
    url += `&numberOfVisits=${numberOfVisits}`;
  }

  return url;
};
