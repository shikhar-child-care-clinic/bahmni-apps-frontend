import {
  Tag,
  TooltipIcon,
  SortableDataTable,
  Link,
} from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React, { useMemo } from 'react';
import {
  FormattedLabInvestigations,
  LabTestPriority,
  LabTestResult,
} from './models';
import styles from './styles/LabInvestigation.module.scss';

interface LabInvestigationItemProps {
  test: FormattedLabInvestigations;
}
const LabInvestigationItem: React.FC<LabInvestigationItemProps> = ({
  test,
}) => {
  const { t } = useTranslation();

  const hasResults =
    Array.isArray(test.result) && (test.result as LabTestResult[]).length > 0;

  const tableRows = useMemo(() => {
    if (!hasResults) return [];
    return (test.result as LabTestResult[]).map((result, index) => ({
      id: `${test.id}-${index}`,
      testName: result.TestName,
      result: result.Result,
      referenceRange: result.referenceRange,
      reportedOn: result.reportedOn,
      status: result.status,
      interpretation: result.interpretation,
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

  const renderCell = (row: (typeof tableRows)[0], cellId: string) => {
    const isAbnormal = row.interpretation === 'A';

    switch (cellId) {
      case 'testName':
        return <span className={styles.testName}>{row.testName || '--'}</span>;
      case 'result':
        return (
          <span className={isAbnormal ? styles.abnormalResult : undefined}>
            {row.result || '--'}
          </span>
        );
      case 'referenceRange':
        return row.referenceRange || '--';
      case 'reportedOn':
        return row.reportedOn || '--';
      case 'actions':
        return (
          <Link
            onClick={() => {
              // TODO: Implement attachment view logic
            }}
          >
            {t('LAB_TEST_VIEW_ATTACHMENT')}
          </Link>
        );
      default:
        return undefined;
    }
  };

  return (
    <div className={styles.labTest}>
      <div className={styles.labTestHeader}>
        <div className={styles.labTestInfo}>
          <span>{test.testName}</span>
          {test.testType === 'Panel' && (
            <span className={styles.testDetails}>
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
        <span className={styles.testDetails}>
          {t('LAB_TEST_ORDERED_BY')}: {test.orderedBy}
        </span>
      </div>
      {hasResults ? (
        <SortableDataTable
          headers={tableHeaders}
          rows={tableRows}
          ariaLabel={`${test.testName} results`}
          data-testid={`lab-test-results-table-${test.testName}`}
          renderCell={renderCell}
          className={styles.labTestResultsTable}
        />
      ) : (
        <div className={styles.testResultsPending}>
          {t('LAB_TEST_RESULTS_PENDING') + ' ....'}
        </div>
      )}
    </div>
  );
};

export default LabInvestigationItem;
