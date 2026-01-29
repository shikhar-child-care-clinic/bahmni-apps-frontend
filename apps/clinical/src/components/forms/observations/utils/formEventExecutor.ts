import { runEventScript } from '@bahmni/form2-controls';
import { Form2Observation, FormMetadata } from '@bahmni/services';

interface FormEventContext {
  observations: Form2Observation[];
  patient: { uuid: string };
  formName?: string;
  formUuid?: string;
  formData?: FormDataRecord;
}

type FormDataRecord = Record<string, unknown> & {
  control?: Record<string, unknown> & {
    concept?: { name?: string; uuid?: string };
    label?: { value?: string };
  };
  concept?: { name?: string };
  label?: { value?: string };
  name?: string;
  value?: unknown;
  children?: FormDataRecord[];
};

export const executeOnFormSaveEvent = (
  metadata: FormMetadata,
  observations: Form2Observation[],
  patientUuid: string,
  formData?: FormDataRecord,
): Form2Observation[] => {
  const schema = metadata.schema as Record<string, unknown>;
  const onFormSaveScript = (schema?.events as Record<string, unknown>)
    ?.onFormSave as string;

  if (!onFormSaveScript) {
    return observations;
  }

  try {
    // Validate the script
    if (
      typeof onFormSaveScript !== 'string' ||
      onFormSaveScript.trim() === ''
    ) {
      throw new Error('Invalid onFormSave script: not a string or empty');
    }

    const formContext: FormEventContext = {
      observations: JSON.parse(JSON.stringify(observations)),
      patient: { uuid: patientUuid },
      formName: metadata.name,
      formUuid: metadata.uuid,
      formData: formData,
    };

    // Use form2-controls runEventScript function
    // It handles base64 decoding, script execution, and provides form.get() support
    const result = runEventScript(
      formData,
      onFormSaveScript,
      formContext.patient,
    );

    // Return modified observations if event returns them
    if (Array.isArray(result)) {
      return result;
    }

    // If event doesn't return anything, use the modified context
    return formContext.observations;
  } catch (error) {
    // Extract error message to show users which form failed
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : error && typeof error === 'object' && 'message' in error
            ? String(error.message)
            : 'Unknown error occurred';

    const formattedError = `Error in onFormSave event for form "${metadata.name}": ${errorMessage}`;

    throw new Error(formattedError);
  }
};

/**
 * Check if form metadata contains an onFormSave event
 */
export const hasFormSaveEvent = (metadata: FormMetadata | null): boolean => {
  if (!metadata) return false;
  const schema = metadata.schema as Record<string, unknown>;
  return Boolean((schema?.events as Record<string, unknown>)?.onFormSave);
};
