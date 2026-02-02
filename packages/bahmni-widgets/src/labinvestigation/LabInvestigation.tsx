import {
  Accordion,
  AccordionItem,
  CodeSnippetSkeleton,
} from '@bahmni/design-system';
import {
  shouldEnableEncounterFilter,
  useTranslation,
  getCategoryUuidFromOrderTypes,
  getFormattedError,
  getLabInvestigationsBundle,
  getDiagnosticReports,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useEffect, useState } from 'react';

import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetProps } from '../registry/model';
import LabInvestigationItem from './LabInvestigationItem';
import { FormattedLabInvestigations, LabTestsByDate } from './models';
import styles from './styles/LabInvestigation.module.scss';
import {
  filterLabInvestigationEntries,
  formatLabInvestigations,
  groupLabInvestigationsByDate,
  getProcessedTestIds,
  getTestIdToReportIdMap,
} from './utils';

const fetchLabInvestigations = async (
  patientUUID: string,
  category: string,
  t: (key: string) => string,
  encounterUuids?: string[],
  numberOfVisits?: number,
): Promise<FormattedLabInvestigations[]> => {
  const bundle = await getLabInvestigationsBundle(
    patientUUID,
    category,
    encounterUuids,
    numberOfVisits,
  );
  const filteredEntries = filterLabInvestigationEntries(bundle);
  return formatLabInvestigations(filteredEntries, t);
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
  const [openAccordionIndex, setOpenAccordionIndex] = useState<number | null>(
    0,
  );

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
  } = useQuery<FormattedLabInvestigations[]>({
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

  const labTests: FormattedLabInvestigations[] = useMemo(
    () => labTestsData ?? [],
    [labTestsData],
  );
  const isLoading = isLoadingOrderTypes || isLoadingLabInvestigations;
  const hasError = isOrderTypesError || isLabInvestigationsError;

  const labTestsByDate = useMemo<LabTestsByDate[]>(() => {
    return groupLabInvestigationsByDate(labTests);
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
    queryFn: () => getDiagnosticReports(patientUUID!, openAccordionTestIds),
    enabled:
      !!patientUUID &&
      openAccordionTestIds.length > 0 &&
      openAccordionIndex !== null,
  });

  const processedTestIds = useMemo(() => {
    return getProcessedTestIds(diagnosticReports);
  }, [diagnosticReports]);

  const testIdToReportIdMap = useMemo(() => {
    return getTestIdToReportIdMap(diagnosticReports);
  }, [diagnosticReports]);

  if (hasError) {
    return (
      <div className={styles.labInvestigationTableBodyError}>
        {t('LAB_TEST_ERROR_LOADING')}
      </div>
    );
  }

  if (isLoading) {
    return (
      <CodeSnippetSkeleton
        type="multi"
        className={styles.labSkeleton}
        testId="lab-skeleton"
      />
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
    <Accordion align="start">
      {labTestsByDate.map((group: LabTestsByDate, index) => (
        <AccordionItem
          key={group.date}
          className={styles.accordionItem}
          open={index === openAccordionIndex}
          onHeadingClick={() => {
            setOpenAccordionIndex(openAccordionIndex === index ? null : index);
          }}
          title={group.date}
        >
          {/* Render 'urgent' tests first */}
          {group.tests
            ?.filter((test) => test.priority === 'Urgent')
            .map((test) => (
              <LabInvestigationItem
                key={`urgent-${group.date}-${test.testName}-${test.id || test.testName}`}
                test={test}
                isOpen={index === openAccordionIndex}
                hasProcessedReport={processedTestIds.includes(test.id)}
                reportId={testIdToReportIdMap.get(test.id)}
              />
            ))}

          {/* Then render non-urgent tests */}
          {group.tests
            ?.filter((test) => test.priority !== 'Urgent')
            .map((test) => (
              <LabInvestigationItem
                key={`nonurgent-${group.date}-${test.testName}-${test.id || test.testName}`}
                test={test}
                isOpen={index === openAccordionIndex}
                hasProcessedReport={processedTestIds.includes(test.id)}
                reportId={testIdToReportIdMap.get(test.id)}
              />
            ))}
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default LabInvestigation;
