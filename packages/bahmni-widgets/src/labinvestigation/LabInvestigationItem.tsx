import { Tag, TooltipIcon, SortableDataTable } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React, { useMemo } from 'react';
import { FormattedLabTest, LabTestPriority, LabTestResult } from './models';
import styles from './styles/LabInvestigation.module.scss';

interface LabInvestigationItemProps {
  test: FormattedLabTest;
}
const LabInvestigationItem: React.FC<LabInvestigationItemProps> = ({
  test,
}) => {
  const { t } = useTranslation();

  // Check if results are available
  const hasResults =
    Array.isArray(test.result) && (test.result as LabTestResult[]).length > 0;

  // Prepare table data
  const tableRows = useMemo(() => {
    if (!hasResults) return [];
    return (test.result as LabTestResult[]).map((result, index) => ({
      id: `${test.id}-${index}`,
      testName: result.TestName,
      result: result.Result,
      referenceRange: result.referenceRange,
      reportedOn: result.reportedOn,
      status: result.status,
    }));
  }, [hasResults, test.result, test.id]);

  const tableHeaders = useMemo(
    () => [
      { key: 'testName', header: t('LAB_TEST_NAME') },
      { key: 'result', header: t('LAB_TEST_RESULT') },
      { key: 'referenceRange', header: t('LAB_TEST_REFERENCE_RANGE') },
      { key: 'reportedOn', header: t('LAB_TEST_REPORTED_ON') },
      { key: 'actions', header: t('LAB_TEST_ACTIONS') },
    ],
    [t],
  );

  return (
    <div className={styles.labBox}>
      <div className={styles.labHeaderWrapper}>
        <div className={styles.labTestNameWrapper}>
          <span>{test.testName}</span>
          {test.testType === 'Panel' && (
            <span className={styles.testInfo}>
              {t(`LAB_TEST_${test.testType.toUpperCase()}`)}
            </span>
          )}
          {test.note && (
            <TooltipIcon
              iconName="fa-file-lines"
              content={test.note}
              ariaLabel={test.note}
            />
          )}
          {test.priority === LabTestPriority.stat && (
            <Tag type="red" data-testid={`lab-test-priority-${test.priority}`}>
              {t(`LAB_TEST_${test.priority.toUpperCase()}`)}
            </Tag>
          )}
        </div>
        <span className={styles.testInfo}>
          {t('LAB_TEST_ORDERED_BY')}: {test.orderedBy}
        </span>
      </div>
      {hasResults ? (
        <SortableDataTable
          headers={tableHeaders}
          rows={tableRows}
          ariaLabel={`${test.testName} results`}
          data-testid={`lab-test-results-table-${test.testName}`}
        />
      ) : (
        <div className={styles.testInfo}>
          {t('LAB_TEST_RESULTS_PENDING') + ' ....'}
        </div>
      )}
    </div>
  );
};

export default LabInvestigationItem;
