import {
  FHIR_LAB_ORDER_CONCEPT_TYPE_EXTENSION_URL,
  formatDate,
  PROCESSED_REPORT_STATUSES,
} from '@bahmni/services';
import { Bundle, ServiceRequest, DiagnosticReport, Observation } from 'fhir/r4';
import {
  FormattedLabTest,
  LabTestPriority,
  LabTestsByDate,
  LabTestResult,
} from './models';

/**
 * Filters out lab test entries that have been replaced or are replacing other entries
 * @param labTestBundle - The FHIR bundle containing lab test service requests
 * @returns An array of filtered ServiceRequest resources
 */
export function filterLabTestEntries(
  labTestBundle: Bundle<ServiceRequest>,
): ServiceRequest[] {
  if (!labTestBundle.entry) return [];

  // Collect all IDs that are being replaced
  const replacedIds = new Set(
    labTestBundle.entry
      .flatMap((entry) => entry.resource?.replaces ?? [])
      .map((ref) => ref.reference?.split('/').pop()) // extract ID from reference like "ServiceRequest/xyz"
      .filter(Boolean), // remove undefined/null
  );

  // Filter out entries that either have a "replaces" field or are being replaced
  const filteredEntries = labTestBundle.entry.filter((entry) => {
    const entryId = entry.resource?.id;
    const isReplacer = entry.resource?.replaces;
    const isReplaced = replacedIds.has(entryId);
    return !isReplacer && !isReplaced;
  });

  const filteredBundle: Bundle<ServiceRequest> = {
    ...labTestBundle,
    entry: filteredEntries,
  };

  const labTests =
    filteredBundle.entry
      ?.map((entry) => entry.resource)
      .filter((r): r is ServiceRequest => r !== undefined) ?? [];

  return labTests;
}

/**
 * Maps a FHIR priority code to LabTestPriority enum
 * @param labTest - The FHIR ServiceRequest to extract priority from
 * @returns The mapped LabTestPriority enum value
 */
export const mapLabTestPriority = (
  labTest: ServiceRequest,
): LabTestPriority => {
  switch (labTest.priority) {
    case 'routine':
      return LabTestPriority.routine;
    case 'stat':
      return LabTestPriority.stat;
    default:
      return LabTestPriority.routine;
  }
};

/**
 * Determines if a lab test is a panel based on its extension
 * @param labTest - The FHIR ServiceRequest to check
 * @returns A string indicating the test type: "Panel" or "Single Test"
 */
export const determineTestType = (labTest: ServiceRequest): string => {
  // Check if the test has an extension that indicates it's a panel
  const panelExtension = labTest.extension?.find(
    (ext) =>
      ext.url === FHIR_LAB_ORDER_CONCEPT_TYPE_EXTENSION_URL &&
      ext.valueString === 'Panel',
  );

  if (panelExtension) {
    return 'Panel';
  }

  // If it's not a panel, it's a single test
  return 'Single Test';
};

/**
 * Formats FHIR lab tests into a more user-friendly format
 * @param labTests - The FHIR ServiceRequest array to format
 * @param t - Translation function for date formatting
 * @returns An array of formatted lab test objects
 */
export function formatLabTests(
  labTests: ServiceRequest[],
  t: (key: string) => string,
): FormattedLabTest[] {
  return labTests
    .filter(
      (labTest): labTest is ServiceRequest & { id: string } => !!labTest.id,
    )
    .map((labTest) => {
      const priority = mapLabTestPriority(labTest);
      const orderedDate = labTest.occurrencePeriod?.start;
      let formattedDate;
      if (orderedDate) {
        const dateFormatResult = formatDate(orderedDate, t, 'MMMM d, yyyy');
        formattedDate =
          dateFormatResult.formattedResult || orderedDate.split('T')[0];
      }

      const testType = determineTestType(labTest);
      const note = labTest.note?.[0]?.text;

      return {
        id: labTest.id,
        testName: labTest.code?.text ?? '',
        priority,
        orderedBy: labTest.requester?.display ?? '',
        orderedDate: orderedDate ?? '',
        formattedDate: formattedDate ?? '',
        // Result would typically come from a separate Observation resource
        result: undefined,
        testType,
        note,
      };
    });
}

/**
 * Groups lab tests by date
 * @param labTests - The formatted lab tests to group
 * @returns An array of lab tests grouped by date, sorted by newest first
 */
export function groupLabTestsByDate(
  labTests: FormattedLabTest[],
): LabTestsByDate[] {
  const dateMap = new Map<string, LabTestsByDate>();

  labTests.forEach((labTest) => {
    const dateKey = labTest.orderedDate.split('T')[0]; // Get YYYY-MM-DD part

    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, {
        date: labTest.formattedDate,
        rawDate: labTest.orderedDate,
        tests: [],
      });
    }

    dateMap.get(dateKey)?.tests.push(labTest);
  });

  // Sort by date (newest first)
  return Array.from(dateMap.values()).sort(
    (a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime(),
  );
}

/**
 * Extracts processed (completed) diagnostic report IDs from a bundle
 * @param diagnosticReportsBundle - The FHIR bundle containing diagnostic reports
 * @returns An array of report IDs that have a processed status
 */
export function getProcessedReportIds(
  diagnosticReportsBundle: Bundle<DiagnosticReport> | undefined,
): string[] {
  if (!diagnosticReportsBundle?.entry) return [];

  return diagnosticReportsBundle.entry
    .filter((entry) => {
      const report = entry.resource;
      return (
        report?.status &&
        PROCESSED_REPORT_STATUSES.includes(
          report.status as (typeof PROCESSED_REPORT_STATUSES)[number],
        )
      );
    })
    .map((entry) => entry.resource?.id)
    .filter((id): id is string => !!id);
}

/**
 * Extracts observations from a diagnostic report bundle
 * @param bundle - The FHIR bundle containing diagnostic report and related resources
 * @returns An array of Observation resources
 */
export function extractObservationsFromBundle(
  bundle: Bundle | undefined,
): Observation[] {
  if (!bundle?.entry) return [];

  return bundle.entry
    .filter((entry) => entry.resource?.resourceType === 'Observation')
    .map((entry) => entry.resource as Observation)
    .filter((obs): obs is Observation => !!obs);
}

/**
 * Formats FHIR observations into LabTestResult format
 * @param observations - Array of FHIR Observation resources
 * @param t - Translation function for date formatting
 * @returns Array of formatted lab test results
 */
export function formatObservationsAsLabTestResults(
  observations: Observation[],
  t: (key: string) => string,
): LabTestResult[] {
  return observations.map((obs) => {
    const testName = obs.code?.text ?? obs.code?.coding?.[0]?.display ?? '';
    const resultValue =
      obs.valueQuantity?.value?.toString() ??
      obs.valueString ??
      obs.valueCodeableConcept?.text ??
      '';
    const unit = obs.valueQuantity?.unit ?? '';
    const result = unit ? `${resultValue} ${unit}` : resultValue;

    const referenceRange =
      obs.referenceRange
        ?.map((range) => {
          const low = range.low?.value;
          const high = range.high?.value;
          const rangeUnit = range.low?.unit ?? range.high?.unit ?? '';
          if (low !== undefined && high !== undefined) {
            return `${low} - ${high} ${rangeUnit}`.trim();
          } else if (low !== undefined) {
            return `> ${low} ${rangeUnit}`.trim();
          } else if (high !== undefined) {
            return `< ${high} ${rangeUnit}`.trim();
          }
          return range.text ?? '';
        })
        .join(', ') ?? '';

    const reportedOn = obs.issued
      ? formatDate(obs.issued, t, 'MMMM d, yyyy').formattedResult || obs.issued
      : '';

    return {
      status: obs.status || '',
      TestName: testName,
      Result: result,
      referenceRange,
      reportedOn,
      actions: '', // Actions are typically not part of the observation resource
    };
  });
}

/**
 * Maps diagnostic report bundles to test results by test ID
 * @param bundles - Array of diagnostic report bundles
 * @param t - Translation function for date formatting
 * @returns A Map where keys are test IDs (ServiceRequest IDs) and values are LabTestResult arrays
 */
export function mapDiagnosticReportBundlesToTestResults(
  bundles: (Bundle | undefined)[],
  t: (key: string) => string,
): Map<string, LabTestResult[]> {
  const resultsMap = new Map<string, LabTestResult[]>();

  bundles.forEach((bundle) => {
    if (!bundle?.entry) return;

    // Find the DiagnosticReport resource in the bundle
    const diagnosticReportEntry = bundle.entry.find(
      (entry) => entry.resource?.resourceType === 'DiagnosticReport',
    );
    const diagnosticReport = diagnosticReportEntry?.resource as
      | DiagnosticReport
      | undefined;

    if (!diagnosticReport?.basedOn) return;

    // Extract the test/ServiceRequest ID from the basedOn reference
    diagnosticReport.basedOn.forEach((ref) => {
      const testId = ref.reference?.split('/').pop();
      if (!testId) return;

      // Extract observations from the bundle
      const observations = extractObservationsFromBundle(bundle);

      // Format observations as LabTestResult[]
      const results = formatObservationsAsLabTestResults(observations, t);

      if (results.length > 0) {
        resultsMap.set(testId, results);
      }
    });
  });

  return resultsMap;
}

/**
 * Updates tests with results from diagnostic report bundles
 * @param tests - Array of formatted lab tests
 * @param resultsMap - Map of test ID to LabTestResult arrays
 * @returns Updated array of tests with results
 */
export function updateTestsWithResults(
  tests: FormattedLabTest[],
  resultsMap: Map<string, LabTestResult[]>,
): FormattedLabTest[] {
  return tests.map((test) => {
    const results = resultsMap.get(test.id);
    if (results) {
      return {
        ...test,
        result: results,
      };
    }
    return test;
  });
}
