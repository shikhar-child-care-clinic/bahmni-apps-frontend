import {
  createFhirPatient,
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
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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

interface CreatePatientFormData {
  profile: BasicInfoData & {
    dobEstimated: boolean;
    patientIdentifier: PatientIdentifier;
    image?: string;
  };
  address: PatientAddress;
  contact: PersonAttributesData;
  additional: PersonAttributesData;
  additionalIdentifiers: AdditionalIdentifiersData;
  /**
   * @deprecated Relationship creation via the FHIR Patient endpoint is not
   * supported. Relationships will be migrated to a dedicated FHIR call in a
   * follow-up story. This field is retained for API compatibility but is NOT
   * sent to the backend in this implementation.
   */
  relationships: RelationshipData[];
}

export const useCreatePatient = () => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const { personAttributes } = usePersonAttributes();

  const mutation = useMutation({
    mutationFn: async (
      formData: CreatePatientFormData,
    ): Promise<FhirPatientResource> => {
      const fhirPayload = buildFhirPatientResource({
        profile: formData.profile,
        address: formData.address,
        contact: formData.contact,
        additional: formData.additional,
        additionalIdentifiers: formData.additionalIdentifiers,
        personAttributes,
      });

      const response =
        await createFhirPatient<FhirPatientResource>(fhirPayload);

      // Upload patient photo via the REST v2 endpoint if provided
      if (formData.profile.image && response.id) {
        await uploadPatientPhoto(response.id, formData.profile.image);
      }

      return response;
    },
    onSuccess: (response) => {
      addNotification({
        title: t('NOTIFICATION_SUCCESS_TITLE'),
        message: t('NOTIFICATION_PATIENT_SAVED_SUCCESSFULLY'),
        type: 'success',
        timeout: 5000,
      });

      const patientUuid = response?.id;
      if (patientUuid) {
        dispatchAuditEvent({
          eventType: AUDIT_LOG_EVENT_DETAILS.REGISTER_NEW_PATIENT
            .eventType as AuditEventType,
          patientUuid,
          module: AUDIT_LOG_EVENT_DETAILS.REGISTER_NEW_PATIENT.module,
        });

        const patientDisplay =
          [
            response.name?.[0]?.given?.join(' '),
            response.name?.[0]?.family,
          ]
            .filter(Boolean)
            .join(' ') || patientUuid;

        window.history.replaceState(
          {
            patientDisplay,
            patientUuid,
          },
          '',
          `/registration/patient/${patientUuid}`,
        );
      } else {
        navigate('/registration/search');
      }
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: t('ERROR_SAVING_PATIENT'),
        message: error instanceof Error ? error.message : String(error),
        timeout: 5000,
      });
    },
  });

  return mutation;
};
