import { useTranslation } from '@bahmni/services';
import type { ImagingStudy, Observation } from 'fhir/r4';
import React, { useMemo } from 'react';
import { ObservationsRenderer } from '../observationsRenderer';

export interface QualityAssessmentProps {
  imagingStudy: ImagingStudy | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
}

export const QualityAssessment: React.FC<QualityAssessmentProps> = ({
  imagingStudy,
  isLoading = false,
  isError = false,
  errorMessage,
}) => {
  const { t } = useTranslation();

  const observations = useMemo(() => {
    if (!imagingStudy?.contained) {
      return [];
    }

    return imagingStudy.contained.filter(
      (resource) => resource.resourceType === 'Observation',
    ) as Observation[];
  }, [imagingStudy]);

  return (
    <ObservationsRenderer
      observations={observations}
      isLoading={isLoading}
      isError={isError}
      errorMessage={errorMessage}
      emptyStateMessage={t('NO_QUALITY_ASSESSMENT_DATA')}
    />
  );
};

export default QualityAssessment;
