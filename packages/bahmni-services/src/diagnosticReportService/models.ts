import { DiagnosticReport, Observation } from 'fhir/r4';

export const COMPLETED_REPORT_STATUSES = [
  'preliminary',
  'final',
  'amended',
  'corrected',
  'appended',
] as const;

export const PENDING_REPORT_STATUSES = [
  'registered',
  'unknown',
  'partial',
] as const;

export interface ObservationResult {
  readonly id: string;
  readonly testName: string;
  readonly result: string;
  readonly unit?: string;
  readonly referenceRange?: string;
  readonly interpretation?: string;
  readonly reportedOn?: string;
  readonly status: string;
}

export interface FormattedDiagnosticReport {
  readonly id: string;
  readonly status: string;
  readonly serviceRequestId: string; // basedOn reference ID
  readonly observations: ObservationResult[];
  readonly effectiveDateTime?: string;
  readonly issued?: string;
  readonly conclusion?: string;
}

export interface DiagnosticReportBundleResult {
  readonly diagnosticReport: DiagnosticReport;
  readonly observations: Observation[];
}
