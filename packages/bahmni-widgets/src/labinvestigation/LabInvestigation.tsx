import { Accordion, AccordionItem, SkeletonText } from '@bahmni/design-system';
import {
  shouldEnableEncounterFilter,
  useTranslation,
  getCategoryUuidFromOrderTypes,
  getFormattedError,
  getLabTestBundle,
  getDiagnosticReportsByOrders,
  getDiagnosticReportBundle,
} from '@bahmni/services';
import { useQuery, useQueries } from '@tanstack/react-query';
import React, { useMemo, useEffect, useState } from 'react';

import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetProps } from '../registry/model';
import LabInvestigationItem from './LabInvestigationItem';
import { FormattedLabTest, LabTestsByDate } from './models';
import styles from './styles/LabInvestigation.module.scss';
import {
  filterLabTestEntries,
  formatLabTests,
  groupLabTestsByDate,
  getProcessedReportIds,
  mapDiagnosticReportBundlesToTestResults,
  updateTestsWithResults,
} from './utils';

const fetchLabInvestigations = async (
  patientUUID: string,
  category: string,
  t: (key: string) => string,
  encounterUuids?: string[],
  numberOfVisits?: number,
): Promise<FormattedLabTest[]> => {
  const bundle = await getLabTestBundle(
    patientUUID,
    category,
    encounterUuids,
    numberOfVisits,
  );
  const filteredEntries = filterLabTestEntries(bundle);
  return formatLabTests(filteredEntries, t);
};

const LabInvestigation: React.FC<WidgetProps> = ({
  config,
  encounterUuids,
  episodeOfCareUuids,
}) => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const { addNotification } = useNotification();
  const categoryName = config?.orderType as string;
  const numberOfVisits = config?.numberOfVisits as number;
  const [openAccordionIndex, setOpenAccordionIndex] = useState<number | null>(0);

  const emptyEncounterFilter = shouldEnableEncounterFilter(
    episodeOfCareUuids,
    encounterUuids,
  );

  const {
    data: categoryUuid,
    isLoading: isLoadingOrderTypes,
    isError: isOrderTypesError,
    error: orderTypesError,
  } = useQuery({
    queryKey: ['categoryUuid', categoryName],
    queryFn: () => getCategoryUuidFromOrderTypes(categoryName),
    enabled: !!categoryName,
  });

  const {
    data: labTestsData,
    isLoading: isLoadingLabInvestigations,
    isError: isLabInvestigationsError,
    error: labInvestigationsError,
  } = useQuery<FormattedLabTest[]>({
    queryKey: [
      'labInvestigations',
      categoryUuid,
      patientUUID,
      encounterUuids,
      numberOfVisits,
    ],
    enabled: !!patientUUID && !!categoryUuid && !emptyEncounterFilter,
    queryFn: () =>
      fetchLabInvestigations(
        patientUUID!,
        categoryUuid!,
        t,
        encounterUuids,
        numberOfVisits,
      ),
  });

  useEffect(() => {
    if (isOrderTypesError) {
      const { message } = getFormattedError(orderTypesError);
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message,
        type: 'error',
      });
    }
    if (isLabInvestigationsError) {
      const { message } = getFormattedError(labInvestigationsError);
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message,
        type: 'error',
      });
    }
  }, [
    isOrderTypesError,
    orderTypesError,
    isLabInvestigationsError,
    labInvestigationsError,
    addNotification,
    t,
  ]);

  const labTests: FormattedLabTest[] = useMemo(
    () => labTestsData ?? [],
    [labTestsData],
  );
  const isLoading = isLoadingOrderTypes || isLoadingLabInvestigations;
  const hasError = isOrderTypesError || isLabInvestigationsError;

  // Group the lab tests by date
  const labTestsByDate = useMemo<LabTestsByDate[]>(() => {
    return groupLabTestsByDate(labTests);
  }, [labTests]);

  // Get test IDs for the currently open accordion
  const openAccordionTestIds = useMemo(() => {
    if (openAccordionIndex !== null && labTestsByDate[openAccordionIndex]) {
      return labTestsByDate[openAccordionIndex].tests.map((test) => test.id);
    }
    return [];
  }, [openAccordionIndex, labTestsByDate]);

  // Fetch diagnostic reports for the open accordion
  const { data: diagnosticReports } = useQuery({
    queryKey: ['diagnosticReports', patientUUID, openAccordionTestIds],
    queryFn: () =>
      getDiagnosticReportsByOrders(patientUUID!, openAccordionTestIds),
    enabled:
      !!patientUUID &&
      openAccordionTestIds.length > 0 &&
      openAccordionIndex !== null,
  });

  // Filter completed diagnostic reports and extract their IDs
  const processedReportIds = useMemo(() => {
    return getProcessedReportIds(diagnosticReports);
  }, [diagnosticReports]);

  // Fetch diagnostic report bundles for all processed reports
  const diagnosticReportBundles = useQueries({
    queries: processedReportIds.map((reportId) => ({
      queryKey: ['diagnosticReportBundle', reportId],
      queryFn: () => getDiagnosticReportBundle(reportId),
      enabled: !!reportId,
    })),
  });

  // Map diagnostic report bundles to test results
  const testResultsMap = useMemo(() => {
    const bundles = diagnosticReportBundles.map((query) => query.data);
    return mapDiagnosticReportBundlesToTestResults(bundles, t);
  }, [diagnosticReportBundles, t]);

  // Update labTestsByDate with results for the open accordion
  const labTestsByDateWithResults = useMemo(() => {
    if (openAccordionIndex === null) return labTestsByDate;

    return labTestsByDate.map((group, index) => {
      if (index === openAccordionIndex) {
        return {
          ...group,
          tests: updateTestsWithResults(group.tests, testResultsMap),
        };
      }
      return group;
    });
  }, [labTestsByDate, openAccordionIndex, testResultsMap]);

  if (hasError) {
    return (
      <div className={styles.labInvestigationTableBodyError}>
        {t('LAB_TEST_ERROR_LOADING')}
      </div>
    );
  }

  if (isLoading) {
    return (
      <>
        <SkeletonText lineCount={3} width="100%" />
        <div>{t('LAB_TEST_LOADING')}</div>
      </>
    );
  }

  if (!isLoading && (labTests.length === 0 || emptyEncounterFilter)) {
    return (
      <div className={styles.labInvestigationTableBodyError}>
        {t('LAB_TEST_UNAVAILABLE')}
      </div>
    );
  }

  return (
    <section>
      <Accordion align="start" size="lg" className={styles.accordianHeader}>
        {labTestsByDateWithResults.map((group: LabTestsByDate, index) => (
          <AccordionItem
            key={group.date}
            className={styles.accordionItem}
            open={index === openAccordionIndex}
            onHeadingClick={() => {
              setOpenAccordionIndex(
                openAccordionIndex === index ? null : index,
              );
            }}
            title={
              <span className={styles.accordionTitle}>
                <strong>{group.date}</strong>
              </span>
            }
          >
            {/* Render 'urgent' tests first */}
            {group.tests
              ?.filter((test) => test.priority === 'Urgent')
              .map((test) => (
                <LabInvestigationItem
                  key={`urgent-${group.date}-${test.testName}-${test.id || test.testName}`}
                  test={test}
                />
              ))}

            {/* Then render non-urgent tests */}
            {group.tests
              ?.filter((test) => test.priority !== 'Urgent')
              .map((test) => (
                <LabInvestigationItem
                  key={`nonurgent-${group.date}-${test.testName}-${test.id || test.testName}`}
                  test={test}
                />
              ))}
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

export default LabInvestigation;
