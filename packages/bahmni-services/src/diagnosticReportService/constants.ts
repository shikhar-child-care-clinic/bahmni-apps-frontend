import { OPENMRS_FHIR_R4 } from '../constants/app';


export const DIAGNOSTIC_REPORTS_BY_ORDERS_URL = (
  patientUuid: string,
  serviceRequestIds: string,
) => {
  return `${OPENMRS_FHIR_R4}/DiagnosticReport?patient=${patientUuid}&basedon=${serviceRequestIds}`;
};


export const DIAGNOSTIC_REPORT_BUNDLE_URL = (diagnosticReportId: string) => {
  return `${OPENMRS_FHIR_R4}/DiagnosticReportBundle/${diagnosticReportId}`;
};
