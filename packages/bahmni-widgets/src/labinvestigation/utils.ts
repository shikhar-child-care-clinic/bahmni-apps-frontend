import {
  FHIR_LAB_ORDER_CONCEPT_TYPE_EXTENSION_URL,
  formatDate,
  PROCESSED_REPORT_STATUSES,
} from '@bahmni/services';
import { Bundle, ServiceRequest, DiagnosticReport, Observation } from 'fhir/r4';
import {
  FormattedLabInvestigations,
  LabTestPriority,
  LabTestsByDate,
  LabTestResult,
} from './models';

export function filterLabInvestigationEntries(
  labInvestigationBundle: Bundle<ServiceRequest>,
): ServiceRequest[] {
  if (!labInvestigationBundle.entry) return [];

  const replacedIds = new Set(
    labInvestigationBundle.entry
      .flatMap((entry) => entry.resource?.replaces ?? [])
      .map((ref) => ref.reference?.split('/').pop()) // extract ID from reference like "ServiceRequest/xyz"
      .filter(Boolean), // remove undefined/null
  );

  // Filter out entries that either have a "replaces" field or are being replaced
  const filteredEntries = labInvestigationBundle.entry.filter((entry) => {
    const entryId = entry.resource?.id;
    const isReplacer = entry.resource?.replaces;
    const isReplaced = replacedIds.has(entryId);
    return !isReplacer && !isReplaced;
  });

  const filteredBundle: Bundle<ServiceRequest> = {
    ...labInvestigationBundle,
    entry: filteredEntries,
  };

  const labInvestigations =
    filteredBundle.entry
      ?.map((entry) => entry.resource)
      .filter((r): r is ServiceRequest => r !== undefined) ?? [];

  return labInvestigations;
}

/**
 * Maps a FHIR priority code to LabTestPriority enum
 **/
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

export function formatLabInvestigations(
  labInvestigations: ServiceRequest[],
  t: (key: string) => string,
): FormattedLabInvestigations[] {
  return labInvestigations
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

export function groupLabInvestigationsByDate(
  labTests: FormattedLabInvestigations[],
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

export function extractObservationsFromBundle(
  bundle: Bundle | undefined,
): Observation[] {
  if (!bundle?.entry) return [];

  return bundle.entry
    .filter((entry) => entry.resource?.resourceType === 'Observation')
    .map((entry) => entry.resource as Observation)
    .filter((obs): obs is Observation => !!obs);
}

export function formatObservationsAsLabTestResults(
  observations: Observation[],
  t: (key: string) => string,
): LabTestResult[] {
  return observations.map((obs) => {
    const testName = obs.code?.text ?? obs.code?.coding?.[0]?.display ?? '';

    // Determine result value with unit
    // FHIR Observation.value[x] handled types: valueQuantity, valueCodeableConcept,valueString, valueBoolean, valueInteger
    let result = '';
    if (obs.valueQuantity?.value !== undefined) {
      // Quantitative result with optional unit (e.g., "5.8 mmol/L")
      const value = obs.valueQuantity.value.toString();
      const unit = obs.valueQuantity.unit ?? '';
      result = unit ? `${value} ${unit}` : value;
    } else if (obs.valueBoolean !== undefined) {
      result = obs.valueBoolean ? 'Positive' : 'Negative';
    } else if (obs.valueInteger !== undefined) {
      result = obs.valueInteger.toString();
    } else if (obs.valueString) {
      result = obs.valueString;
    } else if (obs.valueCodeableConcept?.text) {
      result = obs.valueCodeableConcept.text;
    } else if (obs.valueCodeableConcept?.coding?.[0]?.display) {
      result = obs.valueCodeableConcept.coding[0].display;
    }

    //TODO: test when api returns referenceRange.
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

      const observations = extractObservationsFromBundle(bundle);
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
  tests: FormattedLabInvestigations[],
  resultsMap: Map<string, LabTestResult[]>,
): FormattedLabInvestigations[] {
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
