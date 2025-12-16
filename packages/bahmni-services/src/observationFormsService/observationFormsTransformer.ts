import {
  FormMetadata,
  ObservationDataInFormControls,
  ConceptValue,
} from './models';

export type { ObservationDataInFormControls, ConceptValue };

export interface FormControlData {
  id: string;
  conceptUuid: string;
  type:
    | 'text'
    | 'number'
    | 'date'
    | 'datetime'
    | 'select'
    | 'multiselect'
    | 'section'
    | 'obsControl';
  value:
    | string
    | number
    | boolean
    | Date
    | ConceptValue
    | ConceptValue[]
    | null;
  label?: string;
  units?: string;
  interpretation?: string;
  groupMembers?: FormControlData[];
}

export interface FormData {
  controls: FormControlData[];
  metadata?: Record<string, unknown>;
}

function transformControlValue(
  control: FormControlData,
): string | number | boolean | ConceptValue {
  if (control.value === null || control.value === undefined) {
    throw new Error(`Control ${control.id} has no value`);
  }

  if (control.value instanceof Date) {
    return control.value.toISOString();
  }

  if (
    control.type === 'select' &&
    typeof control.value === 'object' &&
    !Array.isArray(control.value)
  ) {
    return control.value as ConceptValue;
  }

  if (control.type === 'multiselect' && Array.isArray(control.value)) {
    throw new Error(
      'Multiselect values should be handled by creating multiple observations',
    );
  }

  return control.value as string | number | boolean;
}

function transformGroupMembers(
  groupMembers: FormControlData[],
): ObservationDataInFormControls[] {
  return groupMembers
    .filter((member) => member.value !== null && member.value !== undefined)
    .map((member) => ({
      concept: { uuid: member.conceptUuid },
      value: transformControlValue(member),
      obsDatetime: new Date().toISOString(),
      formNamespace: 'Bahmni',
      formFieldPath: member.id,
      interpretation: member.interpretation,
      groupMembers: member.groupMembers
        ? transformGroupMembers(member.groupMembers)
        : undefined,
    }));
}

/**
 * Transforms FormData to ObservationDataInFormControls[] for the backend API
 *
 * This is the final step in the data flow:
 * forms2-controls format → FormControlData[] → ObservationDataInFormControls[]
 *
 * The forms2-controls format has { concept: {name}, formFieldPath, value, groupMembers }
 * This gets normalized to FormControlData[] by useObservationFormData hook
 * And finally transformed here to the backend API format
 */
export function transformFormDataToObservations(
  formData: FormData,
  metadata: FormMetadata,
): ObservationDataInFormControls[] {
  if (!formData.controls || formData.controls.length === 0) {
    return [];
  }

  const observations: ObservationDataInFormControls[] = [];
  const timestamp = new Date().toISOString();

  formData.controls.forEach((control) => {
    // Skip sections without concept UUIDs
    if (control.type === 'section' && !control.conceptUuid) {
      return;
    }

    // Handle controls with group members (obsGroupControl)
    // These have value: null but contain children
    if (control.groupMembers && control.groupMembers.length > 0) {
      const observation: ObservationDataInFormControls = {
        concept: { uuid: control.conceptUuid },
        value: null,
        obsDatetime: timestamp,
        formNamespace: 'Bahmni',
        formFieldPath: control.id,
        groupMembers: transformGroupMembers(control.groupMembers),
      };

      observations.push(observation);
      return;
    }

    // Skip controls without values (and without group members)
    if (control.value === null || control.value === undefined) {
      return;
    }

    try {
      if (control.type === 'multiselect' && Array.isArray(control.value)) {
        control.value.forEach((selectedValue) => {
          const observation: ObservationDataInFormControls = {
            concept: { uuid: control.conceptUuid },
            value: selectedValue,
            obsDatetime: timestamp,
            formNamespace: 'Bahmni',
            formFieldPath: control.id,
          };

          if (control.interpretation) {
            observation.interpretation = control.interpretation;
          }

          observations.push(observation);
        });
        return;
      }

      const observation: ObservationDataInFormControls = {
        concept: { uuid: control.conceptUuid },
        value: transformControlValue(control),
        obsDatetime: timestamp,
        formNamespace: 'Bahmni',
        formFieldPath: control.id,
      };

      if (control.interpretation) {
        observation.interpretation = control.interpretation;
      }

      observations.push(observation);
    } catch (error) {
      // Continue processing other controls
    }
  });

  return observations;
}

export function transformObservationsToFormData(
  observations: ObservationDataInFormControls[],
  formMetadata: FormMetadata,
): FormData {
  if (!observations || observations.length === 0) {
    return {
      controls: [],
      metadata: {},
    };
  }

  const controlsMap = new Map<string, FormControlData>();

  observations.forEach((obs) => {
    const fieldPath = obs.formFieldPath ?? obs.concept.uuid;

    if (controlsMap.has(fieldPath)) {
      const existingControl = controlsMap.get(fieldPath)!;

      if (!Array.isArray(existingControl.value)) {
        existingControl.value = [existingControl.value as ConceptValue];
      }

      if (typeof obs.value === 'object' && !Array.isArray(obs.value)) {
        (existingControl.value as ConceptValue[]).push(
          obs.value as ConceptValue,
        );
      }

      existingControl.type = 'multiselect';
    } else {
      let controlValue: string | number | boolean | Date | ConceptValue | null =
        obs.value as string | number | boolean | Date | ConceptValue | null;

      if (
        typeof obs.value === 'string' &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obs.value)
      ) {
        const parsedDate = new Date(obs.value);
        if (!isNaN(parsedDate.getTime())) {
          controlValue = parsedDate;
        }
      }

      const control: FormControlData = {
        id: fieldPath,
        conceptUuid: obs.concept.uuid,
        type: 'obsControl',
        value: controlValue,
      };

      if (obs.interpretation) {
        control.interpretation = obs.interpretation;
      }

      controlsMap.set(fieldPath, control);
    }
  });

  return {
    controls: Array.from(controlsMap.values()),
    metadata: { formMetadata },
  };
}
