import { SortableDataTable } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import classNames from 'classnames';
import type { ImagingStudy, Observation } from 'fhir/r4';
import React, { useMemo } from 'react';
import { ExtractedObservation } from '../observations/models';
import { formatObservationValue } from '../observations/utils';
import styles from '../radiologyInvestigationReport/styles/RadiologyInvestigationReport.module.scss';

export interface QualityAssessmentProps {
  imagingStudy: ImagingStudy | null;
  isLoading?: boolean;
}

interface ObservationMemberProps {
  member: ExtractedObservation;
  depth?: number;
  memberIndex?: number;
}

const getObservationDisplayInfo = (observation: ExtractedObservation) => {
  const observationValue = observation.observationValue;
  if (!observationValue) {
    return { rangeString: '', isAbnormal: false };
  }

  const { referenceRange } = observationValue;
  const lowNormal = referenceRange?.low?.value;
  const hiNormal = referenceRange?.high?.value;

  const hasLow = lowNormal != null;
  const hasHigh = hiNormal != null;

  let rangeString = '';
  if (hasLow && hasHigh) {
    rangeString = ` (${lowNormal} - ${hiNormal})`;
  } else if (hasLow) {
    rangeString = ` (>${lowNormal})`;
  } else if (hasHigh) {
    rangeString = ` (<${hiNormal})`;
  }

  const isAbnormal = observationValue.isAbnormal ?? false;

  return { rangeString, isAbnormal };
};

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
              key={`${nestedMember.id}-${nestedMember.id}`}
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
                key={`${member.id}-${member.id}`}
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

const extractObservationsFromContained = (
  imagingStudy: ImagingStudy,
): ExtractedObservation[] => {
  if (!imagingStudy.contained) return [];

  const observations: Observation[] = imagingStudy.contained.filter(
    (resource) => resource.resourceType === 'Observation',
  ) as Observation[];

  const observationsMap = new Map<string, Observation>();
  const childIds = new Set<string>();

  observations.forEach((obs) => {
    if (!obs.id) return;
    observationsMap.set(obs.id, obs);
    obs.hasMember?.forEach((memberRef) => {
      const id = memberRef.reference?.split('/').pop();
      if (id) childIds.add(id);
    });
  });

  const extractSingleObservation = (
    observation: Observation,
  ): ExtractedObservation => {
    const members = (observation.hasMember ?? [])
      .map((ref) => ref.reference?.split('/').pop())
      .map((id) => (id ? observationsMap.get(id) : undefined))
      .filter((obs): obs is Observation => !!obs)
      .map((obs) => extractSingleObservation(obs));

    const sortId =
      observation.extension
        ?.find(({ url }) => url.includes('form-namespace-path'))
        ?.valueString?.split('/')[1] ?? '';

    return {
      id: observation.id!,
      display:
        observation.code?.text ?? observation.code?.coding?.[0]?.display ?? '',
      observationValue: extractObservationValue(observation),
      effectiveDateTime: observation.effectiveDateTime,
      issued: observation.issued,
      members: members.length > 0 ? members : undefined,
      sortId,
      conceptId: observation.code?.coding?.[0]?.code,
    };
  };

  const extractedObservations: ExtractedObservation[] = [];
  const groupedObservations: ExtractedObservation[] = [];

  observationsMap.forEach((obs, id) => {
    if (childIds.has(id)) return;

    const extracted = extractSingleObservation(obs);

    if (extracted.members) {
      groupedObservations.push(extracted);
    } else {
      extractedObservations.push(extracted);
    }
  });

  return [...extractedObservations, ...groupedObservations];
};

const NORMAL_REFERENCE_RANGE_CODE = 'normal';
const REFERENCE_RANGE_SYSTEM =
  'http://terminology.hl7.org/CodeSystem/referencerange-meaning';
const ABNORMAL_INTERPRETATION_CODE = 'A';
const INTERPRETATION_SYSTEM =
  'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation';

function isAbnormalInterpretation(observation: Observation): boolean {
  if (!observation.interpretation || observation.interpretation.length === 0) {
    return false;
  }

  return observation.interpretation.some((interp) =>
    interp.coding?.some(
      (coding) =>
        coding.system === INTERPRETATION_SYSTEM &&
        coding.code === ABNORMAL_INTERPRETATION_CODE,
    ),
  );
}

function extractObservationValue(
  observation: Observation,
): ExtractedObservation['observationValue'] {
  const {
    valueQuantity,
    valueCodeableConcept,
    valueString,
    valueBoolean,
    valueInteger,
    valueDateTime,
    valueTime,
    referenceRange,
  } = observation;

  const isAbnormal = isAbnormalInterpretation(observation);

  if (valueQuantity) {
    const observationValue: ExtractedObservation['observationValue'] = {
      value: valueQuantity.value ?? '',
      unit: valueQuantity.unit,
      type: 'quantity',
      isAbnormal,
    };

    if (referenceRange && referenceRange.length > 0) {
      const normalRange = referenceRange.find((range) =>
        range.type?.coding?.some(
          (coding) =>
            coding.system === REFERENCE_RANGE_SYSTEM &&
            coding.code === NORMAL_REFERENCE_RANGE_CODE,
        ),
      );

      if (normalRange && (normalRange.low || normalRange.high)) {
        observationValue.referenceRange = {
          low: normalRange.low
            ? {
                value: normalRange.low.value!,
                unit: normalRange.low.unit,
              }
            : undefined,
          high: normalRange.high
            ? {
                value: normalRange.high.value!,
                unit: normalRange.high.unit,
              }
            : undefined,
        };
      }
    }

    return observationValue;
  }

  if (valueCodeableConcept) {
    return {
      value:
        valueCodeableConcept.text ?? valueCodeableConcept!.coding![0]!.display!,
      type: 'codeable',
      isAbnormal,
    };
  }

  if (valueString) {
    return {
      value: valueString,
      type: 'string',
      isAbnormal,
    };
  }

  if (valueDateTime) {
    return {
      value: valueDateTime,
      type: 'dateTime',
      isAbnormal,
    };
  }

  if (valueTime) {
    return {
      value: valueTime,
      type: 'time',
      isAbnormal,
    };
  }

  if (valueBoolean !== undefined) {
    return {
      value: valueBoolean,
      type: 'boolean',
      isAbnormal,
    };
  }

  if (valueInteger !== undefined) {
    return {
      value: valueInteger,
      type: 'integer',
      isAbnormal,
    };
  }

  return undefined;
}

export const QualityAssessment: React.FC<QualityAssessmentProps> = ({
  imagingStudy,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  const transformedObservations = useMemo(() => {
    if (!imagingStudy) return null;

    return extractObservationsFromContained(imagingStudy);
  }, [imagingStudy]);

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
        ariaLabel={''}
        className={styles.fullWidth}
      />
    );
  }

  if (!transformedObservations || transformedObservations.length === 0) {
    return null;
  }

  const sortedObservations = transformedObservations.sort(
    ({ sortId: xSortId = '' }, { sortId: ySortId = '' }) =>
      xSortId.localeCompare(ySortId, undefined, { numeric: true }),
  );

  const multiSelectGroupedObservations = sortedObservations.reduce(
    (
      valueGroupedObs: ExtractedObservation[],
      observation: ExtractedObservation,
    ) => {
      const matchedObs = valueGroupedObs.find(
        (obs: ExtractedObservation) => obs.conceptId === observation.conceptId,
      );

      if (matchedObs) {
        matchedObs.observationValue!.value =
          matchedObs.observationValue?.value +
          ', ' +
          observation.observationValue?.value;
      } else {
        valueGroupedObs.push(observation);
      }
      return valueGroupedObs;
    },
    [],
  );

  return (
    <div
      id="quality-assessment-observations"
      data-testid="quality-assessment-observations-test-id"
      aria-label="quality-assessment-observations-aria-label"
      className={styles.resultsContainer}
    >
      {multiSelectGroupedObservations.map((obs, index) =>
        renderObservation(obs, index, t),
      )}
    </div>
  );
};

export default QualityAssessment;
