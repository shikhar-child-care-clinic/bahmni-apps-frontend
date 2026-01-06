import { ObservationForm, Form2Observation } from '@bahmni/services';
import { useCallback } from 'react';

interface UseObservationFormActionsProps {
  viewingForm: ObservationForm | null | undefined;
  onViewingFormChange: (viewingForm: ObservationForm | null) => void;
  onRemoveForm?: (formUuid: string) => void;
  observations: Form2Observation[];
  onFormObservationsChange?: (
    formUuid: string,
    observations: Form2Observation[],
  ) => void;
  clearFormData: () => void;
}

export function useObservationFormActions({
  viewingForm,
  onViewingFormChange,
  onRemoveForm,
  observations,
  onFormObservationsChange,
  clearFormData,
}: UseObservationFormActionsProps) {
  const handleDiscardForm = useCallback(() => {
    clearFormData();

    if (viewingForm && onRemoveForm) {
      onRemoveForm(viewingForm.uuid);
    }

    onViewingFormChange(null);
  }, [viewingForm, onRemoveForm, onViewingFormChange, clearFormData]);

  const handleSaveForm = useCallback(
    (processedObservations?: Form2Observation[]) => {
      if (viewingForm && onFormObservationsChange) {
        // Use processed observations if provided (from form events), otherwise use current observations
        const observationsToSave = processedObservations ?? observations;
        onFormObservationsChange(viewingForm.uuid, observationsToSave);
      }

      onViewingFormChange(null);
    },
    [viewingForm, onViewingFormChange, observations, onFormObservationsChange],
  );

  const handleBackToForms = useCallback(() => {
    onViewingFormChange(null);
  }, [onViewingFormChange]);

  return {
    handleDiscardForm,
    handleSaveForm,
    handleBackToForms,
  };
}
