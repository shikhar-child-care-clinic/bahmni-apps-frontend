import { Form2Observation, FormMetadata } from '@bahmni/services';

interface FormEventContext {
  observations: Form2Observation[];
  patient: { uuid: string };
  formName?: string;
  formUuid?: string;
  formData?: FormDataRecord;
}

// Extend Window interface to include form2-controls helpers
declare global {
  interface Window {
    runEventScript?: (
      formState: FormDataRecord | unknown,
      script: string,
      patient: { uuid: string },
    ) => Form2Observation[] | void;
  }
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

/**
 * Fallback script execution when helpers.js is not available or fails
 * Handles base64-encoded and plain text scripts
 * Supports both function expressions and statement blocks
 */
const executeScriptFallback = (
  onFormSaveScript: string,
  formContext: FormEventContext,
): Form2Observation[] | void => {
  // Try to decode base64 script (same as helpers.js does)
  let scriptToExecute = onFormSaveScript;
  try {
    // Attempt base64 decode
    scriptToExecute = atob(onFormSaveScript);
  } catch {
    // Not base64 encoded, use as-is
    scriptToExecute = onFormSaveScript;
  }

  const trimmedScript = scriptToExecute.trim();

  let result;

  if (trimmedScript.startsWith('function')) {
    // Both 'form' and 'formContext' parameter names work - they get the same object
    const wrappedScript = `(${scriptToExecute})(formContext)`;
    const eventFunction = new Function(
      'formContext',
      `return ${wrappedScript}`,
    );
    result = eventFunction(formContext);
  } else {
    const eventFunction = new Function(
      'formContext',
      'form',
      `
          ${scriptToExecute}
          return formContext.observations;
        `,
    );
    result = eventFunction(formContext, formContext);
  }

  return result;
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

    let result;
    let useHelpers = false;

    // Use form2-controls helper's runEventScript if available
    // It handles base64 decoding and script execution
    if (window.runEventScript) {
      try {
        result = window.runEventScript(
          formData,
          onFormSaveScript,
          formContext.patient,
        );
        useHelpers = true;
      } catch {
        // If helpers.js fails, fall back to direct execution
        useHelpers = false;
      }
    }

    // Fallback to new Function if helpers.js is not loaded or failed
    if (!useHelpers) {
      result = executeScriptFallback(onFormSaveScript, formContext);
    }

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

    throw new Error(
      `Error in onFormSave event for form "${metadata.name}": ${errorMessage}`,
    );
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
