import { ComponentType } from 'react';
import { AdditionalIdentifiers } from '../../components/forms/additionalIdentifiers/AdditionalIdentifiers';
import { AdditionalInfo } from '../../components/forms/additionalInfo/AdditionalInfo';
import { AddressInfo } from '../../components/forms/addressInfo/AddressInfo';
import { ContactInfo } from '../../components/forms/contactInfo/ContactInfo';
import { PatientRelationships } from '../../components/forms/patientRelationships/PatientRelationships';
import { Profile } from '../../components/forms/profile/Profile';

export interface FormSectionConfig {
  type: string;
  component: ComponentType<Record<string, unknown>>;
}

export const builtInFormSections: FormSectionConfig[] = [
  { type: 'profile', component: Profile },
  { type: 'address', component: AddressInfo },
  { type: 'contactInfo', component: ContactInfo },
  { type: 'additionalInfo', component: AdditionalInfo },
  { type: 'additionalIdentifiers', component: AdditionalIdentifiers },
  { type: 'relationships', component: PatientRelationships },
];
