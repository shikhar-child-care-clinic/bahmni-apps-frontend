import { Tile } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React from 'react';
import { AdditionalIdentifiersRef } from '../../components/forms/additionalIdentifiers/AdditionalIdentifiers';
import { AdditionalInfoRef } from '../../components/forms/additionalInfo/AdditionalInfo';
import { AddressInfoRef } from '../../components/forms/addressInfo/AddressInfo';
import { ContactInfoRef } from '../../components/forms/contactInfo/ContactInfo';
import {
  PatientRelationshipsRef,
  RelationshipData,
} from '../../components/forms/patientRelationships/PatientRelationships';
import { ProfileRef } from '../../components/forms/profile/Profile';
import { AddressData } from '../../hooks/useAddressFields';
import {
  AdditionalIdentifiersData,
  BasicInfoData,
  PersonAttributesData,
} from '../../models/patient';
import {
  RegistrationFormControl,
  RegistrationFormSection,
} from '../../providers/registrationConfig/models';
import { builtInFormSections } from './formSectionMap';
import styles from './styles/index.module.scss';

export interface FormControlRefs {
  profileRef: React.RefObject<ProfileRef | null>;
  addressRef: React.RefObject<AddressInfoRef | null>;
  contactRef: React.RefObject<ContactInfoRef | null>;
  additionalRef: React.RefObject<AdditionalInfoRef | null>;
  identifiersRef: React.RefObject<AdditionalIdentifiersRef | null>;
  relationshipsRef: React.RefObject<PatientRelationshipsRef | null>;
}

export interface FormControlData {
  profileInitialData: BasicInfoData | undefined;
  addressInitialData: AddressData | undefined;
  personAttributesInitialData: PersonAttributesData | undefined;
  additionalIdentifiersInitialData: AdditionalIdentifiersData | undefined;
  relationshipsInitialData: RelationshipData[] | undefined;
  initialDobEstimated: boolean;
  patientPhoto: string | undefined;
}

export interface FormControlGuards {
  shouldShowAdditionalIdentifiers: boolean;
  relationshipTypes: unknown[];
}

interface PatientRegisterSectionProps {
  section: RegistrationFormSection;
  refs: FormControlRefs;
  data: FormControlData;
  guards: FormControlGuards;
}

const PatientRegisterSection: React.FC<PatientRegisterSectionProps> = ({
  section,
  refs,
  data,
  guards,
}) => {
  const { t } = useTranslation();

  const renderComponent = (type: string): React.ReactNode => {
    const sectionConfig = builtInFormSections.find((s) => s.type === type);
    if (!sectionConfig) return null;

    const Component = sectionConfig.component;

    switch (type) {
      case 'profile':
        return (
          <Component
            ref={refs.profileRef}
            initialData={data.profileInitialData}
            initialDobEstimated={data.initialDobEstimated}
            initialPhoto={data.patientPhoto}
          />
        );
      case 'address':
        return (
          <Component
            ref={refs.addressRef}
            initialData={data.addressInitialData}
          />
        );
      case 'contactInfo':
        return (
          <Component
            ref={refs.contactRef}
            initialData={data.personAttributesInitialData}
          />
        );
      case 'additionalInfo':
        return (
          <Component
            ref={refs.additionalRef}
            initialData={data.personAttributesInitialData}
          />
        );
      case 'additionalIdentifiers':
        if (!guards.shouldShowAdditionalIdentifiers) return null;
        return (
          <Component
            ref={refs.identifiersRef}
            initialData={data.additionalIdentifiersInitialData}
          />
        );
      case 'relationships':
        if (
          !Array.isArray(guards.relationshipTypes) ||
          guards.relationshipTypes.length === 0
        )
          return null;
        return (
          <Component
            ref={refs.relationshipsRef}
            initialData={data.relationshipsInitialData}
          />
        );
      default:
        return null;
    }
  };

  const renderControl = (control: RegistrationFormControl): React.ReactNode => {
    const component = renderComponent(control.type);
    if (!component) return null;

    return (
      <div key={control.type}>
        {control.titleTranslationKey && (
          <div className={styles.controlTitle} data-testid={`control-title-${control.type}`}>
            <span className={styles.formSectionTitle}>{t(control.titleTranslationKey)}</span>
          </div>
        )}
        {component}
      </div>
    );
  };

  return (
    <div className={styles.formContainer}>
      {section.translationKey && (
        <Tile className={styles.headerTile} data-testid="section-header-tile">
          <span className={styles.sectionTitle}>{t(section.translationKey)}</span>
        </Tile>
      )}
      {section.controls.map((control) => renderControl(control))}
    </div>
  );
};

export default PatientRegisterSection;
