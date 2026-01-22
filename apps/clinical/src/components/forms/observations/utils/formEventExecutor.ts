import { Form2Observation, FormMetadata } from '@bahmni/services';

interface FormEventContext {
  observations: Form2Observation[];
  patient: { uuid: string };
  formName?: string;
  formUuid?: string;
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
    const decodedScript = atob(onFormSaveScript);

    // Helper function to recursively find controls by name in formData tree
    const findInFormData = (
      recordTree: FormDataRecord,
      name: string,
    ): FormDataRecord[] => {
      const records: FormDataRecord[] = [];
      if (!recordTree) return records;

      // Get name from control structure
      const nodeName =
        recordTree.control?.concept?.name ??
        recordTree.control?.label?.value ??
        recordTree.concept?.name ??
        recordTree.label?.value ??
        recordTree.name;

      if (nodeName === name) {
        records.push(recordTree);
      }

      // Recursively search children
      if (recordTree.children && Array.isArray(recordTree.children)) {
        for (const child of recordTree.children) {
          records.push(...findInFormData(child, name));
        }
      }

      return records;
    };

    const formContext: FormEventContext = {
      observations: JSON.parse(JSON.stringify(observations)),
      patient: { uuid: patientUuid },
      formName: metadata.name,
      formUuid: metadata.uuid,
    };

    if (formData) {
      (formContext as unknown as Record<string, unknown>).get = (
        name: string,
        index: number = 0,
      ) => {
        const matches = findInFormData(formData, name);
        const currentRecord = matches[index] ?? null;

        return {
          currentRecord,
          getValue: () => {
            if (!currentRecord) return undefined;
            const value = currentRecord.value;

            // If value is an object with a 'value' property, extract the inner value
            if (
              value &&
              typeof value === 'object' &&
              'value' in (value as Record<string, unknown>)
            ) {
              return (value as Record<string, unknown>).value;
            }

            return value;
          },
          setValue: (value: unknown) => {
            if (currentRecord) {
              currentRecord.value = value;
            }
          },
        };
      };
    }

    let result;
    const trimmedScript = decodedScript.trim();

    if (trimmedScript.startsWith('function')) {
      // Both 'form' and 'formContext' parameter names work - they get the same object
      const wrappedScript = `(${decodedScript})(formContext)`;
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
        ${decodedScript}
        return formContext.observations;
      `,
      );
      result = eventFunction(formContext, formContext);
    }

    // Return modified observations if event returns them
    if (Array.isArray(result)) {
      return result;
    }

    // If event doesn't return anything, use the modified context
    return formContext.observations;
  } catch (error) {
    console.error(
      `[FormEvent] Error executing onFormSave for form ${metadata.name}:`,
      error,
    );

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
