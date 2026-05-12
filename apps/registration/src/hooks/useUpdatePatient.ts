import {
  updateFhirPatient,
  uploadPatientPhoto,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
  PersonAttributeType,
  PatientIdentifier,
  PatientAddress,
  useTranslation,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { RelationshipData } from '../components/forms/patientRelationships/PatientRelationships';
import {
  BasicInfoData,
  PersonAttributesData,
  AdditionalIdentifiersData,
} from '../models/patient';
import { usePersonAttributes } from './usePersonAttributes';
import {
  buildFhirPatientResource,
  type FhirPatientResource,
} from '../utils/fhirPatientMapper';

const TRAILING_BRACKETED_SUFFIX = /\s\[.*\]$/;

interface UpdatePatientFormData {
  patientUuid: string;
  profile: BasicInfoData & {
    dobEstimated: boolean;
    patientIdentifier: PatientIdentifier;
    image?: string;
  };
  address: PatientAddress;
  contact: PersonAttributesData;
  additional: PersonAttributesData;
  additionalIdentifiers: AdditionalIdentifiersData;
  additionalIdentifiersInitialData?: AdditionalIdentifiersData;
  /**
   * @deprecated Relationship updates via the FHIR Patient endpoint are not
   * supported. Relationships will be migrated to a dedicated FHIR call in a
   * follow-up story. This field is retained for API compatibility but is NOT
   * sent to the backend in this implementation.
   */
  relationships?: RelationshipData[];
}

export const useUpdatePatient = () => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const { personAttributes } = usePersonAttributes();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (
      formData: UpdatePatientFormData,
    ): Promise<FhirPatientResource> => {
      const fhirPayload = buildFhirPatientResource({
        profile: formData.profile,
        address: formData.address,
        contact: formData.contact,
        additional: formData.additional,
        additionalIdentifiers: formData.additionalIdentifiers,
        personAttributes,
        patientUuid: formData.patientUuid,
      });

      const response = await updateFhirPatient<FhirPatientResource>(
        formData.patientUuid,
        fhirPayload,
      );

      // Upload patient photo via the REST v2 endpoint if provided
      if (formData.profile.image && response.id) {
        await uploadPatientPhoto(response.id, formData.profile.image);
      }

      return response;
    },
    onSuccess: (response, variables) => {
      addNotification({
        title: t('NOTIFICATION_SUCCESS_TITLE'),
        message: t('NOTIFICATION_PATIENT_UPDATED_SUCCESSFULLY'),
        type: 'success',
        timeout: 5000,
      });

      const patientUuid = response?.id;
      if (patientUuid) {
        queryClient.setQueryData(
          ['formattedPatient', variables.patientUuid],
          response,
        );

        dispatchAuditEvent({
          eventType: AUDIT_LOG_EVENT_DETAILS.EDIT_PATIENT_DETAILS
            .eventType as AuditEventType,
          patientUuid,
          module: AUDIT_LOG_EVENT_DETAILS.EDIT_PATIENT_DETAILS.module,
        });
      }
    },
    onError: (error) => {
      const message = (
        error instanceof Error ? error.message : String(error)
      ).replace(TRAILING_BRACKETED_SUFFIX, '');
      addNotification({
        type: 'error',
        title: t('ERROR_UPDATING_PATIENT'),
        message,
        timeout: 5000,
      });
    },
  });

  return mutation;
};
