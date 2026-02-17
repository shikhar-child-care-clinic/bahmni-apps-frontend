import { CollapsibleRowGroup, RowCell } from '@bahmni/design-system';
import React from 'react';
import {
  ExtractedObservation,
  ExtractedObservationsResult,
  GroupedObservation,
} from '../../observations/models';
import styles from './Observations.module.scss';

export interface ObservationsProps {
  transformedObservations: ExtractedObservationsResult | null;
}

const formatObservationValue = (observation: ExtractedObservation): string => {
  if (!observation.observationValue) return '--';

  const { value, unit } = observation.observationValue;
  return unit ? `${value} ${unit}` : String(value);
};

const renderObservation = (
  observation: ExtractedObservation,
  index: number,
  keyPrefix: string = 'obs',
) => {
  const testName = observation.display;
  const value = formatObservationValue(observation);

  return (
    <RowCell
      key={`${keyPrefix}-${observation.id}-${index}`}
      header={testName}
      value={value}
      id={`${keyPrefix}-${observation.id}-${index}`}
      testId={`${keyPrefix}-${observation.id}-${index}`}
      ariaLabel={`${keyPrefix}-${observation.id}-${index}`}
    />
  );
};

const renderGroupedObservation = (
  groupedObs: GroupedObservation,
  groupIndex: number,
) => {
  return (
    <CollapsibleRowGroup
      key={`grouped-obs-${groupedObs.id}-${groupIndex}`}
      title={groupedObs.display}
      id={`grouped-obs-${groupedObs.id}-${groupIndex}`}
      open
    >
      {groupedObs.children.map((child, childIndex) =>
        renderObservation(child, childIndex, `grouped-obs-${groupedObs.id}`),
      )}
    </CollapsibleRowGroup>
  );
};

export const Observations: React.FC<ObservationsProps> = ({
  transformedObservations,
}) => {
  if (!transformedObservations) {
    return null;
  }

  const { observations, groupedObservations } = transformedObservations;

  return (
    <div
      id="radiology-observations"
      data-testid="radiology-observations-test-id"
      aria-label="radiology-observations-aria-label"
      className={styles.resultsContainer}
    >
      {observations.map((obs, index) => renderObservation(obs, index))}
      {groupedObservations.map((groupedObs, index) =>
        renderGroupedObservation(groupedObs, index),
      )}
    </div>
  );
};

export default Observations;
