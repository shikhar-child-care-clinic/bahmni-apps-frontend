import {
  Button,
  Tile,
  BaseLayout,
  Header,
  Icon,
  ICON_SIZE,
} from '@bahmni/design-system';
import {
  BAHMNI_HOME_PATH,
  useTranslation,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
  PatientProfileResponse,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AdditionalIdentifiers,
  AdditionalIdentifiersRef,
} from '../../components/forms/additionalIdentifiers/AdditionalIdentifiers';
import {
  AdditionalInfo,
  AdditionalInfoRef,
} from '../../components/forms/additionalInfo/AdditionalInfo';
import {
  AddressInfo,
  AddressInfoRef,
} from '../../components/forms/addressInfo/AddressInfo';
import {
  ContactInfo,
  ContactInfoRef,
} from '../../components/forms/contactInfo/ContactInfo';
import {
  PatientRelationships,
  PatientRelationshipsRef,
} from '../../components/forms/patientRelationships/PatientRelationships';
import { Profile, ProfileRef } from '../../components/forms/profile/Profile';
import { RegistrationActions } from '../../components/registrationActions/RegistrationActions';
import { BAHMNI_REGISTRATION_SEARCH, getPatientUrl } from '../../constants/app';

import { useAdditionalIdentifiers } from '../../hooks/useAdditionalIdentifiers';
import { useCreatePatient } from '../../hooks/useCreatePatient';
import { usePatientDetails } from '../../hooks/usePatientDetails';
import { usePatientPhoto } from '../../hooks/usePatientPhoto';
import { useRelationshipValidation } from '../../hooks/useRelationshipValidation';
import { useUpdatePatient } from '../../hooks/useUpdatePatient';
import { useRegistrationConfig } from '../../providers/registrationConfig';
import { validateAllSections, collectFormData } from './patientFormService';
import {
  formSectionMap,
  isValidFormControlType,
  type FormControlType,
} from './formSectionMap';
import styles from './styles/index.module.scss';
import { RegistrationFormSection } from '../../providers/registrationConfig/models';

/**
 * Default form sections when not specified in config
 * Maintains backward compatibility with previous hardcoded order
 */
const DEFAULT_FORM_SECTIONS: RegistrationFormSection[] = [
  {
    name: 'Basic Details',
    translationKey: 'REGISTRATION_SECTION_BASIC_DETAILS',
    controls: [
      { type: 'profile' },
      { type: 'address' },
      { type: 'contactInfo' },
    ],
  },
  {
    name: 'Additional Information',
    translationKey: 'REGISTRATION_SECTION_ADDITIONAL_INFO',
    controls: [{ type: 'additionalInfo' }],
  },
  {
    name: 'Identifiers',
    translationKey: 'REGISTRATION_SECTION_IDENTIFIERS',
    controls: [{ type: 'additionalIdentifiers' }],
  },
  {
    name: 'Relationships',
    translationKey: 'REGISTRATION_SECTION_RELATIONSHIPS',
    controls: [{ type: 'relationships' }],
  },
];

const PatientRegister = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { patientUuid: patientUuidFromUrl } = useParams<{
    patientUuid: string;
  }>();

  const [patientUuid, setPatientUuid] = useState<string | null>(
    patientUuidFromUrl ?? null,
  );

  const { shouldShowAdditionalIdentifiers } = useAdditionalIdentifiers();
  const { relationshipTypes } = useRelationshipValidation();
  const { registrationConfig } = useRegistrationConfig();

  const patientProfileRef = useRef<ProfileRef>(null);
  const patientAddressRef = useRef<AddressInfoRef>(null);
  const patientContactRef = useRef<ContactInfoRef>(null);
  const patientAdditionalRef = useRef<AdditionalInfoRef>(null);
  const patientRelationshipsRef = useRef<PatientRelationshipsRef>(null);
  const patientAdditionalIdentifiersRef =
    useRef<AdditionalIdentifiersRef>(null);

  const {
    profileInitialData,
    personAttributesInitialData,
    addressInitialData,
    additionalIdentifiersInitialData,
    relationshipsInitialData,
    initialDobEstimated,
    metadata: initialMetadata,
  } = usePatientDetails({
    patientUuid: patientUuidFromUrl,
  });

  const [metadata, setMetadata] = useState(initialMetadata);

  const { patientPhoto } = usePatientPhoto({
    patientUuid: metadata?.patientUuid,
  });

  useEffect(() => {
    if (initialMetadata) {
      setMetadata(initialMetadata);
    }
  }, [initialMetadata]);

  useEffect(() => {
    if (metadata?.patientUuid) {
      setPatientUuid(metadata.patientUuid);
    }
  }, [metadata]);

  // Use the appropriate mutation based on mode
  const createPatientMutation = useCreatePatient();
  const updatePatientMutation = useUpdatePatient();

  const isSaving =
    createPatientMutation.isPending || updatePatientMutation.isPending;

  // Dispatch audit event when page is viewed
  useEffect(() => {
    dispatchAuditEvent({
      eventType: AUDIT_LOG_EVENT_DETAILS.VIEWED_NEW_PATIENT_PAGE
        .eventType as AuditEventType,
      module: AUDIT_LOG_EVENT_DETAILS.VIEWED_NEW_PATIENT_PAGE.module,
    });
  }, []);

  const handleSave = async (): Promise<string | null> => {
    const isValid = validateAllSections(
      {
        profileRef: patientProfileRef,
        addressRef: patientAddressRef,
        contactRef: patientContactRef,
        additionalRef: patientAdditionalRef,
        relationshipsRef: patientRelationshipsRef,
        additionalIdentifiersRef: patientAdditionalIdentifiersRef,
      },
      addNotification,
      t,
      {
        shouldValidateAdditionalIdentifiers: shouldShowAdditionalIdentifiers,
      },
    );

    if (!isValid) {
      return null;
    }

    const formData = collectFormData(
      {
        profileRef: patientProfileRef,
        addressRef: patientAddressRef,
        contactRef: patientContactRef,
        additionalRef: patientAdditionalRef,
        relationshipsRef: patientRelationshipsRef,
        additionalIdentifiersRef: patientAdditionalIdentifiersRef,
      },
      addNotification,
      t,
    );

    if (!formData) {
      return null;
    }

    try {
      if (patientUuid) {
        const response = (await updatePatientMutation.mutateAsync({
          patientUuid,
          ...formData,
          additionalIdentifiersInitialData,
        })) as PatientProfileResponse;
        if (response?.patient?.uuid) {
          setMetadata({
            ...metadata,
            patientName: response.patient.person.display ?? '',
          });
          patientRelationshipsRef.current?.removeDeletedRelationships();
          return response.patient.uuid;
        }
      } else {
        const response = (await createPatientMutation.mutateAsync(
          formData,
        )) as PatientProfileResponse;
        if (response?.patient?.uuid) {
          const newPatientUuid = response.patient.uuid;
          setPatientUuid(newPatientUuid);
          navigate(getPatientUrl(newPatientUuid));
          return newPatientUuid;
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  const shouldShowActions = metadata?.patientUuid || patientUuidFromUrl == null;

  /**
   * Render a form control based on its type
   * Returns JSX component or null if control type is unknown
   */
  const renderControl = (controlType: string) => {
    if (!isValidFormControlType(controlType as FormControlType)) {
      return null;
    }

    const config = formSectionMap[controlType as FormControlType];
    const Component = config.component;
    const refKey = config.refKey as keyof typeof refsMap;

    // Get the appropriate ref and initial data based on control type
    const getRefAndData = () => {
      switch (controlType) {
        case 'profile':
          return {
            ref: patientProfileRef,
            props: {
              initialData: profileInitialData,
              initialDobEstimated,
              initialPhoto: patientPhoto,
            },
          };
        case 'address':
          return {
            ref: patientAddressRef,
            props: { initialData: addressInitialData },
          };
        case 'contactInfo':
          return {
            ref: patientContactRef,
            props: { initialData: personAttributesInitialData },
          };
        case 'additionalInfo':
          return {
            ref: patientAdditionalRef,
            props: { initialData: personAttributesInitialData },
          };
        case 'additionalIdentifiers':
          return {
            ref: patientAdditionalIdentifiersRef,
            props: { initialData: additionalIdentifiersInitialData },
          };
        case 'relationships':
          return {
            ref: patientRelationshipsRef,
            props: { initialData: relationshipsInitialData },
          };
        default:
          return null;
      }
    };

    const refAndData = getRefAndData();
    if (!refAndData) return null;

    const { ref, props } = refAndData;

    // Apply data-driven guards for certain controls
    if (
      controlType === 'additionalIdentifiers' &&
      !shouldShowAdditionalIdentifiers
    ) {
      return null;
    }
    if (
      controlType === 'relationships' &&
      (!Array.isArray(relationshipTypes) || relationshipTypes.length === 0)
    ) {
      return null;
    }

    return (
      <Component
        key={controlType}
        ref={ref}
        {...(props as Record<string, unknown>)}
      />
    );
  };

  /**
   * Render controls for the first section (Basic Details) - stays inside formContainer
   */
  const renderFirstSectionControls = () => {
    const sections = registrationConfig?.registrationForm?.sections ?? DEFAULT_FORM_SECTIONS;
    const firstSection = sections[0];

    if (!firstSection) return null;

    return firstSection.controls.map((control) =>
      renderControl(control.type),
    );
  };

  /**
   * Render remaining sections (after Basic Details) - rendered outside formContainer
   */
  const renderRemainingControls = () => {
    const sections = registrationConfig?.registrationForm?.sections ?? DEFAULT_FORM_SECTIONS;

    return sections.slice(1).map((section, sectionIndex) => (
      <div key={`section-${sectionIndex + 1}`} className={styles.formSection}>
        {section.controls.map((control) =>
          renderControl(control.type),
        )}
      </div>
    ));
  };

  // Create a ref map for type checking
  const refsMap = {
    profileRef: patientProfileRef,
    addressRef: patientAddressRef,
    contactRef: patientContactRef,
    additionalRef: patientAdditionalRef,
    identifiersRef: patientAdditionalIdentifiersRef,
    relationshipsRef: patientRelationshipsRef,
  };

  const breadcrumbs = [
    {
      id: 'home',
      label: t('CREATE_PATIENT_BREADCRUMB_HOME'),
      href: BAHMNI_HOME_PATH,
    },
    {
      id: 'registration',
      label: t('CREATE_PATIENT_BREADCRUMB_REGISTRATION_SEARCH'),
      href: BAHMNI_REGISTRATION_SEARCH,
    },
    {
      id: 'current',
      label:
        patientUuid && metadata?.patientName
          ? metadata.patientName
          : t('CREATE_PATIENT_BREADCRUMB_CURRENT'),
      isCurrentPage: true,
    },
  ];
  const globalActions = [
    {
      id: 'user',
      label: 'user',
      renderIcon: <Icon id="user" name="fa-user" size={ICON_SIZE.LG} />,
      onClick: () => {},
    },
  ];

  return (
    <BaseLayout
      header={
        <Header breadcrumbItems={breadcrumbs} globalActions={globalActions} />
      }
      main={
        <div>
          <div className={styles.form}>
            <Tile className={styles.patientDetailsHeader}>
              <span className={styles.sectionTitle}>
                {patientUuid ? (
                  <div className={styles.infoContainer}>
                    <div
                      className={styles.patientId}
                    >{`${t('REGISTRATION_PATIENT_SEARCH_HEADER_ID')} : ${metadata?.patientIdentifier}`}</div>
                    <div
                      className={styles.registerDate}
                    >{`${t('CREATE_PATIENT_REGISTERED_ON')} ${metadata?.registerDate}`}</div>
                  </div>
                ) : (
                  t('CREATE_PATIENT_HEADER_TITLE')
                )}
              </span>
            </Tile>

            <div className={styles.formContainer}>
              {renderFirstSectionControls()}
            </div>
          </div>

          {renderRemainingControls()}

          {/* Footer Actions */}
          {shouldShowActions && (
            <div className={styles.formActions}>
              <Button
                kind="tertiary"
                onClick={() => navigate('/registration/search')}
                data-testid="back-to-patient-search-button"
              >
                {t('CREATE_PATIENT_BACK_TO_SEARCH')}
              </Button>
              <div className={styles.actionButtons}>
                <Button
                  kind="tertiary"
                  onClick={handleSave}
                  disabled={isSaving}
                  data-testid="save-patient-button"
                >
                  {t('CREATE_PATIENT_SAVE')}
                </Button>
                <RegistrationActions
                  extensionPointId="org.bahmni.registration.navigation"
                  onBeforeNavigate={handleSave}
                />
              </div>
            </div>
          )}
        </div>
      }
    />
  );
};
export default PatientRegister;
