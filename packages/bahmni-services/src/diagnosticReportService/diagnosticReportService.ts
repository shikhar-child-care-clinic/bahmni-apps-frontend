import { Bundle, DiagnosticReport } from 'fhir/r4';
import { get } from '../api';
import {
  DIAGNOSTIC_REPORTS_BY_ORDERS_URL,
  DIAGNOSTIC_REPORT_BUNDLE_URL,
} from './constants';

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
): Promise<Bundle> {
  if (!diagnosticReportId) {
    throw new Error('DiagnosticReport ID is required');
  }

  const url = DIAGNOSTIC_REPORT_BUNDLE_URL(diagnosticReportId);
  return await get<Bundle>(url);
}
