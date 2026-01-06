import {
  ObservationForm,
  ObservationDataInFormControls,
} from '@bahmni/services';
import { useCallback } from 'react';

interface UseObservationFormActionsProps {
  viewingForm: ObservationForm | null | undefined;
  onViewingFormChange: (viewingForm: ObservationForm | null) => void;
  onRemoveForm?: (formUuid: string) => void;
  observations: ObservationDataInFormControls[];
  onFormObservationsChange?: (
    formUuid: string,
    observations: ObservationDataInFormControls[],
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

  const handleSaveForm = useCallback(() => {
    if (viewingForm && onFormObservationsChange) {
      onFormObservationsChange(viewingForm.uuid, observations);
    }

    onViewingFormChange(null);
  }, [
    viewingForm,
    onViewingFormChange,
    observations,
    onFormObservationsChange,
  ]);

  const handleBackToForms = useCallback(() => {
    onViewingFormChange(null);
  }, [onViewingFormChange]);

  return {
    handleDiscardForm,
    handleSaveForm,
    handleBackToForms,
  };
}
