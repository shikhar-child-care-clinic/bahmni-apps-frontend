import { SortableDataTable } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import classNames from 'classnames';
import type { Observation } from 'fhir/r4';
import React, { useMemo } from 'react';
import { ExtractedObservation } from '../observations/models';
import { formatObservationValue } from '../observations/utils';
import {
  getObservationDisplayInfo,
  sortObservationsBySortId,
  groupMultiSelectObservations,
  transformObservations,
} from '../utils/Observations';
import styles from './styles/ObservationsRenderer.module.scss';

export interface ObservationsRendererProps {
  observations: Observation[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  emptyStateMessage?: string;
  className?: string;
}

interface ObservationMemberProps {
  member: ExtractedObservation;
  depth?: number;
  memberIndex?: number;
}

const ObservationMember: React.FC<ObservationMemberProps> = ({
  member,
  depth = 0,
  memberIndex = 0,
}) => {
  const { t } = useTranslation();
  const hasMembers = member.members && member.members.length > 0;
  const displayLabel = member.display;

  if (hasMembers) {
    return (
      <div
        className={styles.nestedGroup}
        data-testid={`obs-nested-group-${displayLabel}-${memberIndex}`}
      >
        <div
          className={styles.nestedGroupLabel}
          data-testid={`obs-nested-group-label-${displayLabel}-${memberIndex}`}
          // eslint-disable-next-line react/forbid-dom-props
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          {displayLabel}
        </div>
        <div
          className={styles.nestedGroupMembers}
          data-testid={`obs-nested-group-members-${displayLabel}-${memberIndex}`}
        >
          {member.members?.map((nestedMember, nestedIndex) => (
            <ObservationMember
              key={`${nestedMember.id}-${nestedIndex}`}
              member={nestedMember}
              depth={depth + 1}
              memberIndex={nestedIndex}
            />
          ))}
        </div>
      </div>
    );
  }

  const { rangeString, isAbnormal } = getObservationDisplayInfo(member);
  const formattedValue = formatObservationValue(member, t);

  return (
    <div
      className={styles.memberRow}
      data-testid={`obs-member-row-${displayLabel}-${memberIndex}`}
      // eslint-disable-next-line react/forbid-dom-props
      style={{ paddingLeft: `${depth * 16}px` }}
    >
      <p
        className={classNames(
          styles.memberLabel,
          isAbnormal ? styles.abnormalValue : '',
        )}
        data-testid={`obs-member-label-${displayLabel}-${memberIndex}`}
      >
        {displayLabel}
        {rangeString}
      </p>
      <p
        className={classNames(
          styles.memberValue,
          isAbnormal ? styles.abnormalValue : '',
        )}
        data-testid={`obs-member-value-${displayLabel}-${memberIndex}`}
      >
        {formattedValue}
      </p>
    </div>
  );
};

const renderObservation = (
  observation: ExtractedObservation,
  index: number,
  t: (key: string) => string,
) => {
  const hasMembers = observation.members && observation.members.length > 0;
  const { rangeString, isAbnormal } = getObservationDisplayInfo(observation);
  const formattedValue = formatObservationValue(observation, t);

  return (
    <div
      key={`${observation.id}-${index}`}
      className={styles.observation}
      data-testid={`observation-item-${observation.display}-${index}`}
    >
      <div
        className={hasMembers ? styles.groupContainer : styles.rowContainer}
        data-testid={`observation-container-${observation.display}-${index}`}
      >
        <p
          className={classNames(
            hasMembers ? styles.groupLabel : styles.rowLabel,
            !hasMembers && isAbnormal ? styles.abnormalValue : '',
          )}
          data-testid={`observation-label-${observation.display}-${index}`}
        >
          {observation.display}
          {!hasMembers && rangeString && (
            <span className={styles.rangeInfo}>{rangeString}</span>
          )}
        </p>
        {hasMembers ? (
          <div
            className={styles.groupMembers}
            data-testid={`observation-group-members-${observation.display}-${index}`}
          >
            {observation.members?.map((member, memberIndex) => (
              <ObservationMember
                key={`${member.id}-${memberIndex}`}
                member={member}
                depth={0}
                memberIndex={memberIndex}
              />
            ))}
          </div>
        ) : (
          <p
            className={classNames(
              styles.rowValue,
              isAbnormal ? styles.abnormalValue : '',
            )}
            data-testid={`observation-value-${observation.display}-${index}`}
          >
            {formattedValue}
          </p>
        )}
      </div>
    </div>
  );
};

export const ObservationsRenderer: React.FC<ObservationsRendererProps> = ({
  observations,
  isLoading = false,
  isError = false,
  errorMessage,
  emptyStateMessage,
  className,
}) => {
  const { t } = useTranslation();

  const processedObservations = useMemo(() => {
    if (observations.length === 0) return [];

    const transformed = transformObservations(observations);
    const sorted = sortObservationsBySortId(transformed);
    return groupMultiSelectObservations(sorted);
  }, [observations]);

  const headers = [
    { key: 'label', header: 'label' },
    { key: 'value', header: 'value' },
  ];

  if (isLoading) {
    return (
      <SortableDataTable
        headers={headers}
        rows={[]}
        loading
        ariaLabel="Loading observations"
        className={classNames(styles.fullWidth, className)}
      />
    );
  }

  if (isError) {
    return (
      <SortableDataTable
        headers={headers}
        rows={[]}
        errorStateMessage={errorMessage ?? t('ERROR_LOADING_OBSERVATIONS')}
        ariaLabel="Observations error"
        className={classNames(styles.fullWidth, className)}
      />
    );
  }

  if (processedObservations.length === 0) {
    return (
      <SortableDataTable
        headers={headers}
        rows={[]}
        emptyStateMessage={emptyStateMessage ?? t('NO_OBSERVATIONS_AVAILABLE')}
        ariaLabel="No observations"
        className={classNames(styles.fullWidth, className)}
      />
    );
  }

  return (
    <div
      id="observations-renderer"
      data-testid="observations-renderer-test-id"
      aria-label="observations-renderer-aria-label"
      className={classNames(styles.resultsContainer, className)}
    >
      {processedObservations.map((obs, index) =>
        renderObservation(obs, index, t),
      )}
    </div>
  );
};

export default ObservationsRenderer;
