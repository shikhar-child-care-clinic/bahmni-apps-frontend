import type { BundleEntry, Reference } from 'fhir/r4';
import type { ConsultationStartEventPayload } from '../../events/startConsultation';
import type { InputControl as ClinicalInputControlConfig } from '../../providers/clinicalConfig/models';

export interface InputControl {
  key: string;
  encounterTypes?: string[];
  privilege?: string[];
  formConfig?: ClinicalInputControlConfig;
  component: React.ComponentType<{
    consultationStartEventPayload?: ConsultationStartEventPayload;
    formConfig?: ClinicalInputControlConfig;
  }>;
  reset: () => void;
  validate: () => boolean;
  hasData: () => boolean;
  subscribe: (cb: () => void) => () => void;
  createBundleEntries?: (ctx: EncounterContext) => BundleEntry[];
}

export interface EncounterContext {
  encounterSubject: Reference;
  encounterReference: string;
  practitionerUUID: string;
  consultationDate: Date;
  statDurationInMilliseconds?: number;
}
