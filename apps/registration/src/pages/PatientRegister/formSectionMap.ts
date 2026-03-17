import {
  Profile,
  ProfileRef,
} from '../../components/forms/profile/Profile';
import {
  AddressInfo,
  AddressInfoRef,
} from '../../components/forms/addressInfo/AddressInfo';
import {
  ContactInfo,
  ContactInfoRef,
} from '../../components/forms/contactInfo/ContactInfo';
import {
  AdditionalInfo,
  AdditionalInfoRef,
} from '../../components/forms/additionalInfo/AdditionalInfo';
import {
  AdditionalIdentifiers,
  AdditionalIdentifiersRef,
} from '../../components/forms/additionalIdentifiers/AdditionalIdentifiers';
import {
  PatientRelationships,
  PatientRelationshipsRef,
} from '../../components/forms/patientRelationships/PatientRelationships';

/**
 * Maps control types to their components and ref keys
 * Used to dynamically render form sections based on configuration
 */
export interface FormControlConfig {
  component: any; // React component type
  refKey: string; // Key for useRef mapping
}

export type FormControlType =
  | 'profile'
  | 'address'
  | 'contactInfo'
  | 'additionalInfo'
  | 'additionalIdentifiers'
  | 'relationships';

export const formSectionMap: Record<FormControlType, FormControlConfig> = {
  profile: {
    component: Profile,
    refKey: 'profileRef',
  },
  address: {
    component: AddressInfo,
    refKey: 'addressRef',
  },
  contactInfo: {
    component: ContactInfo,
    refKey: 'contactRef',
  },
  additionalInfo: {
    component: AdditionalInfo,
    refKey: 'additionalRef',
  },
  additionalIdentifiers: {
    component: AdditionalIdentifiers,
    refKey: 'identifiersRef',
  },
  relationships: {
    component: PatientRelationships,
    refKey: 'relationshipsRef',
  },
};

/**
 * Get form control configuration by type
 * @param type - The control type
 * @returns FormControlConfig or undefined if type not found
 */
export const getFormControlConfig = (type: string): FormControlConfig | undefined => {
  return formSectionMap[type as FormControlType];
};

/**
 * Check if a control type is valid
 * @param type - The control type to validate
 * @returns true if type exists in the map
 */
export const isValidFormControlType = (type: string): type is FormControlType => {
  return type in formSectionMap;
};
