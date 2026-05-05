import { MedicationAction } from '../models';

export const handleAction = (action: MedicationAction): void => {
  if (action.type === 'administer')
    globalThis.dispatchEvent(
      new CustomEvent('startConsultation', {
        detail: { encounterType: action.encounterType },
      }),
    );
};
