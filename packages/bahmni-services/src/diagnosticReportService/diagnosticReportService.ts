import { Bundle, DiagnosticReport, Observation } from 'fhir/r4';
import { get } from '../api';
import {
  DIAGNOSTIC_REPORTS_BY_ORDERS_URL,
  DIAGNOSTIC_REPORT_BUNDLE_URL,
} from './constants';
import { DiagnosticReportBundleResult } from './models';


export async function getDiagnosticReportsByOrders(
  patientUuid: string,
  serviceRequestIds: string[],
): Promise<Bundle<DiagnosticReport>> {
  if (!patientUuid || serviceRequestIds.length === 0) {
    return {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [],
    };
  }

  // Format ServiceRequest IDs as comma-separated references
  const formattedIds = serviceRequestIds
    .map((id) => `ServiceRequest/${id}`)
    .join(',');

  const url = DIAGNOSTIC_REPORTS_BY_ORDERS_URL(patientUuid, formattedIds);
  return await get<Bundle<DiagnosticReport>>(url);
}


export async function getDiagnosticReportBundle(
  diagnosticReportId: string,
): Promise<DiagnosticReportBundleResult> {
  if (!diagnosticReportId) {
    throw new Error('DiagnosticReport ID is required');
  }

  const url = DIAGNOSTIC_REPORT_BUNDLE_URL(diagnosticReportId);
  const bundle = await get<Bundle>(url);

  // Extract DiagnosticReport and Observations from the bundle
  const diagnosticReport = bundle.entry?.find(
    (entry) => entry.resource?.resourceType === 'DiagnosticReport',
  )?.resource as DiagnosticReport;

  const observations =
    bundle.entry
      ?.filter((entry) => entry.resource?.resourceType === 'Observation')
      .map((entry) => entry.resource as Observation)
      .filter((resource): resource is Observation => !!resource) ?? [];

  if (!diagnosticReport) {
    throw new Error(
      `DiagnosticReport not found in bundle for ID: ${diagnosticReportId}`,
    );
  }

  return {
    diagnosticReport,
    observations,
  };
}
