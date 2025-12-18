import {
  FormData,
  FormControlData,
  ObservationDataInFormControls,
  FormMetadata,
  ConceptValue,
  transformFormDataToObservations,
  validateFormData,
  hasFormData,
} from '@bahmni/services';
import { useCallback, useState } from 'react';

interface UseObservationFormDataProps {
  initialFormData?: FormData | null;
  formMetadata: FormMetadata;
}

interface UseObservationFormDataReturn {
  formData: FormData | null;
  observations: ObservationDataInFormControls[];
  hasData: boolean;
  isValid: boolean;
  validationErrors: Array<{ field: string; message: string }>;
  handleFormDataChange: (data: unknown) => void;
  clearFormData: () => void;
}

interface ImmutableData {
  toJS(): unknown;
}

interface FormControlRecord {
  control?: {
    concept?: { name?: string; uuid?: string };
    type?: string;
  };
  formFieldPath?: string;
  value?: {
    value?: unknown;
    interpretation?: string;
  };
  children?: FormControlRecord[];
  voided?: boolean;
}

interface FormControlTree {
  formFieldPath: string;
  children?: FormControlRecord[];
}

const isImmutableData = (data: unknown): data is ImmutableData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'toJS' in data &&
    typeof (data as ImmutableData).toJS === 'function'
  );
};

const isFormControlTree = (data: unknown): data is FormControlTree => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'formFieldPath' in data &&
    'children' in data
  );
};

const isFormData = (data: unknown): data is FormData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'controls' in data &&
    Array.isArray((data as FormData).controls)
  );
};

export function useObservationFormData(
  props?: UseObservationFormDataProps,
): UseObservationFormDataReturn {
  const [formData, setFormData] = useState<FormData | null>(
    props?.initialFormData ?? null,
  );

  const handleFormDataChange = useCallback((data: unknown) => {
    if (!data) {
      setFormData(null);
      return;
    }

    const plainData = isImmutableData(data) ? data.toJS() : data;

    const extractControls = (
      record: FormControlTree,
      controls: FormControlData[],
    ): void => {
      if (!record.children) return;

      record.children.forEach((controlRecord) => {
        if (controlRecord.voided) return;

        const conceptUuid = controlRecord.control?.concept?.uuid;
        const fieldPath = controlRecord.formFieldPath;
        if (!conceptUuid || !fieldPath) return;

        const isObsGroupControl =
          controlRecord.control?.type === 'obsGroupControl';

        if (isObsGroupControl) {
          if (controlRecord.children?.length) {
            const groupMembers: FormControlData[] = [];
            extractControls(
              { formFieldPath: '', children: controlRecord.children },
              groupMembers,
            );

            if (groupMembers.length > 0) {
              controls.push({
                id: fieldPath,
                conceptUuid,
                type: 'obsControl',
                value: null,
                groupMembers,
              });
            }
          }
          return;
        }

        const value = controlRecord.value?.value;
        if (value === null || value === undefined || value === '') return;

        const control: FormControlData = {
          id: fieldPath,
          conceptUuid,
          type: Array.isArray(value) ? 'multiselect' : 'obsControl',
          value: value as
            | string
            | number
            | boolean
            | Date
            | ConceptValue
            | ConceptValue[]
            | null,
        };

        if (controlRecord.value?.interpretation) {
          control.interpretation = controlRecord.value.interpretation;
        }

        controls.push(control);
      });
    };

    let normalizedData: FormData | null = null;

    if (isFormControlTree(plainData)) {
      const controls: FormControlData[] = [];
      extractControls(plainData, controls);
      normalizedData = { controls, metadata: {} };
    } else if (isFormData(plainData)) {
      normalizedData = plainData;
    } else if (Array.isArray(plainData)) {
      normalizedData = { controls: plainData, metadata: {} };
    }

    setFormData(normalizedData);
  }, []);

  const clearFormData = useCallback(() => {
    setFormData(null);
  }, []);

  const hasData = formData ? hasFormData(formData) : false;

  const validation = formData
    ? validateFormData(formData)
    : { isValid: true, errors: [] };
  const isValid = validation.isValid;
  const validationErrors = validation.errors;

  const observations =
    formData && isValid && hasData && props?.formMetadata
      ? transformFormDataToObservations(formData, props.formMetadata)
      : [];

  return {
    formData,
    observations,
    hasData,
    isValid,
    validationErrors,
    handleFormDataChange,
    clearFormData,
  };
}
