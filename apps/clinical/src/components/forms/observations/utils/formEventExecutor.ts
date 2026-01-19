import { Form2Observation, FormMetadata } from '@bahmni/services';

interface FormEventContext {
  observations: Form2Observation[];
  patient: { uuid: string };
  formName?: string;
  formUuid?: string;
}

export const executeOnFormSaveEvent = (
  metadata: FormMetadata,
  observations: Form2Observation[],
  patientUuid: string,
): Form2Observation[] => {
  const schema = metadata.schema as any;
  const onFormSaveScript = schema?.events?.onFormSave;

  if (!onFormSaveScript) {
    return observations;
  }

  try {
    const decodedScript = atob(onFormSaveScript);

    const formContext: FormEventContext = {
      observations: JSON.parse(JSON.stringify(observations)),
      patient: { uuid: patientUuid },
      formName: metadata.name,
      formUuid: metadata.uuid,
    };

    // The script can be in different formats:
    // 1. Anonymous function with 'form' parameter: function(form) { ... } (legacy)
    // 2. Anonymous function with 'formContext' parameter: function(formContext) { ... } (new)
    // 3. Function body code: formContext.observations = ...
    // Scripts have direct access to observations array and can manipulate it as needed

    let result;
    const trimmedScript = decodedScript.trim();

    // Check if script starts with "function" - it's a function expression
    if (trimmedScript.startsWith('function')) {
      // Both 'form' and 'formContext' parameter names work - they get the same object
      const wrappedScript = `(${decodedScript})(formContext)`;
      const eventFunction = new Function(
        'formContext',
        `return ${wrappedScript}`,
      );
      result = eventFunction(formContext);
    } else {
      // It's function body code - make both 'form' and 'formContext' available
      const eventFunction = new Function(
        'formContext',
        'form',
        `
        ${decodedScript}
        return formContext.observations;
      `,
      );
      result = eventFunction(formContext, formContext);
    }

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
    // Log for debugging
    console.error(
      `[FormEvent] Error executing onFormSave for form ${metadata.name}:`,
      error,
    );

    // Re-throw with better context for component to handle
    throw new Error(
      `Error returned by event script for onFormSave event for form "${metadata.name}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
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
