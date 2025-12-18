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

    let plainData: unknown = data;
    if (
      typeof data === 'object' &&
      'toJS' in data &&
      typeof (data as { toJS: unknown }).toJS === 'function'
    ) {
      plainData = (data as { toJS: () => unknown }).toJS() as unknown;
    }

    let normalizedData: FormData | null = null;

    if (
      typeof plainData === 'object' &&
      plainData !== null &&
      'formFieldPath' in plainData &&
      'children' in plainData
    ) {
      const controlRecordTree = plainData as {
        formFieldPath: string;
        children?: unknown[];
      };

      const extractControls = (
        record: typeof controlRecordTree,
        controls: FormControlData[],
      ): void => {
        if (record.children && Array.isArray(record.children)) {
          record.children.forEach((child) => {
            if (child && typeof child === 'object') {
              const childRecord = child as {
                control?: {
                  concept?: { name?: string; uuid?: string };
                  type?: string;
                };
                formFieldPath?: string;
                value?: {
                  value?: unknown;
                  interpretation?: string;
                };
                children?: unknown[];
                voided?: boolean;
              };

              if (childRecord.voided) {
                return;
              }

              const conceptUuid = childRecord.control?.concept?.uuid;
              const fieldPath = childRecord.formFieldPath;
              const isObsGroupControl =
                childRecord.control?.type === 'obsGroupControl';

              if (isObsGroupControl && conceptUuid && fieldPath) {
                if (
                  childRecord.children &&
                  Array.isArray(childRecord.children) &&
                  childRecord.children.length > 0
                ) {
                  const groupMembers: FormControlData[] = [];
                  extractControls(
                    { formFieldPath: '', children: childRecord.children },
                    groupMembers,
                  );

                  if (groupMembers.length > 0) {
                    const control: FormControlData = {
                      id: fieldPath,
                      conceptUuid,
                      type: 'obsControl',
                      value: null,
                      groupMembers,
                    };
                    controls.push(control);
                  }
                }
              } else if (
                childRecord.value?.value !== null &&
                childRecord.value?.value !== undefined &&
                childRecord.value?.value !== ''
              ) {
                if (conceptUuid && fieldPath) {
                  const rawValue = childRecord.value.value;
                  const isArray = Array.isArray(rawValue);

                  const control: FormControlData = {
                    id: fieldPath,
                    conceptUuid,
                    type: isArray ? 'multiselect' : ('obsControl' as const),
                    value: rawValue as
                      | string
                      | number
                      | boolean
                      | Date
                      | ConceptValue
                      | ConceptValue[]
                      | null,
                  };

                  if (childRecord.value?.interpretation) {
                    control.interpretation = childRecord.value.interpretation;
                  }

                  controls.push(control);
                }
              }
            }
          });
        }
      };

      const controls: FormControlData[] = [];
      extractControls(controlRecordTree, controls);

      normalizedData = {
        controls,
        metadata: {},
      };
    } else if (
      typeof plainData === 'object' &&
      plainData !== null &&
      'controls' in plainData &&
      Array.isArray((plainData as FormData).controls)
    ) {
      normalizedData = plainData as FormData;
    } else if (Array.isArray(plainData)) {
      normalizedData = {
        controls: plainData,
        metadata: {},
      };
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
