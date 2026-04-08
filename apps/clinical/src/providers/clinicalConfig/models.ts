export interface AllergyConceptMap {
  medicationAllergenUuid: string;
  foodAllergenUuid: string;
  environmentalAllergenUuid: string;
  allergyReactionUuid: string;
}

export interface ImmunizationModeConfig {
  fieldConfig: import('../../models/immunization').FieldConfig;
}

export interface ImmunizationFormConfig {
  vaccineConceptSetUuid: string;
  routeConceptSetUuid: string;
  siteConceptSetUuid: string;
  notDoneStatusReasonConceptSetUuid: string;
  history?: ImmunizationModeConfig;
  administration?: ImmunizationModeConfig;
  notDone?: ImmunizationModeConfig;
}

export interface ConsultationPad {
  allergyConceptMap: AllergyConceptMap;
  immunizationForm?: ImmunizationFormConfig;
  statDurationInMilliseconds?: number;
}

export interface Dashboard {
  name: string;
  url: string;
  requiredPrivileges: string[];
  icon?: string;
  default?: boolean;
}

export interface ProgramConfig {
  fields: string[];
}

export interface ContextInformation {
  program?: ProgramConfig;
}

export interface ClinicalConfig {
  patientInformation: Record<string, unknown>;
  contextInformation?: ContextInformation;
  actions: Array<unknown>;
  dashboards: Array<Dashboard>;
  consultationPad: ConsultationPad;
}

export interface ClinicalConfigContextType {
  clinicalConfig: ClinicalConfig | null | undefined;
  isLoading: boolean;
  error: Error | null;
}
