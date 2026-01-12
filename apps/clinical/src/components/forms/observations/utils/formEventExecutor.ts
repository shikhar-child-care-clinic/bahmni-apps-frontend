import { Form2Observation, FormMetadata } from '@bahmni/services';

interface FormEventContext {
  observations: Form2Observation[];
  patient: { uuid: string };
  formName?: string;
  formUuid?: string;
}

/**
 * Execute onFormSave event for a form before saving
 * Events are base64-encoded as per PR #112 (BAH-4360)
 *
 * @param metadata - Form metadata containing event scripts
 * @param observations - Current form observations
 * @param patientUuid - Patient UUID for context
 * @returns Modified observations or original if no event/error
 */
export const executeOnFormSaveEvent = (
  metadata: FormMetadata,
  observations: Form2Observation[],
  patientUuid: string,
): Form2Observation[] => {
  // Access events from form schema
  const schema = metadata.schema as any;
  const onFormSaveScript = schema?.events?.onFormSave;

  if (!onFormSaveScript) {
    // No onFormSave event defined - return original observations
    return observations;
  }

  try {
    // Decode base64-encoded event script (as per BAH-4360)
    const decodedScript = atob(onFormSaveScript);

    // Create execution context that the event script can access
    const formContext: FormEventContext = {
      observations: JSON.parse(JSON.stringify(observations)), // Deep clone
      patient: { uuid: patientUuid },
      formName: metadata.name,
      formUuid: metadata.uuid,
    };

    // Execute event script safely using Function constructor
    // The script receives formContext and can modify formContext.observations
    const eventFunction = new Function(
      'formContext',
      `
      ${decodedScript}
      return formContext.observations;
    `,
    );

    const result = eventFunction(formContext);

    // Return modified observations if event returns them
    if (Array.isArray(result)) {
      console.log(
        `[FormEvent] onFormSave executed for form: ${metadata.name}`,
        {
          originalCount: observations.length,
          processedCount: result.length,
        },
      );
      return result;
    }

    // If event doesn't return anything, use the modified context
    return formContext.observations;
  } catch (error) {
    console.error(
      `[FormEvent] Error executing onFormSave for form ${metadata.name}:`,
      error,
    );
    // Return original observations on error to prevent data loss
    return observations;
  }
};

/**
 * Check if form metadata contains an onFormSave event
 */
export const hasFormSaveEvent = (metadata: FormMetadata | null): boolean => {
  if (!metadata) return false;
  const schema = metadata.schema as any;
  return Boolean(schema?.events?.onFormSave);
};

/**
 * Decode and return the onFormSave script for debugging/inspection
 */
export const getFormSaveEventScript = (
  metadata: FormMetadata,
): string | null => {
  const schema = metadata.schema as any;
  const onFormSaveScript = schema?.events?.onFormSave;

  if (!onFormSaveScript) {
    return null;
  }

  try {
    return atob(onFormSaveScript);
  } catch (error) {
    console.error('[FormEvent] Error decoding onFormSave script:', error);
    return null;
  }
};
