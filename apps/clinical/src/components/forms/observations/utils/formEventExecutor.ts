import { Form2Observation, FormMetadata } from '@bahmni/services';

// Form field accessor provides access to observation data
// Supports both old format (currentRecord/getValue) and direct property access
interface FormFieldAccessor extends Partial<Form2Observation> {
  currentRecord: Form2Observation | null;
  getValue: () => Form2Observation['value'] | null;
}

interface FormEventContext {
  observations: Form2Observation[];
  patient: { uuid: string };
  formName?: string;
  formUuid?: string;
  // Backward compatibility: Provide get() method for
  get?: (conceptNameOrUuid: string, index?: number) => FormFieldAccessor;
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
      get: (conceptNameOrUuid: string, index: number = 0) => {
        const findObservations = (
          obsList: Form2Observation[],
        ): Form2Observation[] => {
          const results: Form2Observation[] = [];

          for (const obs of obsList) {
            const concept = obs.concept as { uuid: string; name?: string };
            if (
              concept?.name === conceptNameOrUuid ||
              concept?.uuid === conceptNameOrUuid
            ) {
              results.push(obs);
            }

            if (obs.groupMembers && obs.groupMembers.length > 0) {
              results.push(...findObservations(obs.groupMembers));
            }
          }

          return results;
        };

        const matchingObs = findObservations(formContext.observations);

        const observation = matchingObs[index];

        if (!observation) {
          return {
            currentRecord: null,
            getValue: () => null,
          };
        }

        return Object.assign(observation, {
          currentRecord: observation,
          getValue: () => observation.value,
        }) as FormFieldAccessor;
      },
    };

    // The script can be in different formats:
    // 1. Anonymous function with 'form' parameter: function(form) { ... } (legacy)
    // 2. Anonymous function with 'formContext' parameter: function(formContext) { ... } (new)
    // 3. Function body code: formContext.observations = ...
    // We support both 'form' and 'formContext' parameter names for compatibility

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
      `Failed to execute onFormSave event for form "${metadata.name}": ${
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
