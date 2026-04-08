export type ImmunizationMode = 'history' | 'not-done' | 'administration';

export type FieldBehavior = 'visible' | 'required' | 'hidden' | 'readonly';

export interface FieldConfig {
  doseSequence?: FieldBehavior;
  drug?: FieldBehavior;
  administeredOn?: FieldBehavior;
  location?: FieldBehavior;
  route?: FieldBehavior;
  site?: FieldBehavior;
  manufacturer?: FieldBehavior;
  batchNumber?: FieldBehavior;
  expirationDate?: FieldBehavior;
  notes?: FieldBehavior;
  statusReason?: FieldBehavior;
}

export type FieldConfigKey = keyof FieldConfig;

export interface ImmunizationInputEntry {
  id: string;

  vaccineConceptUuid: string;
  vaccineDisplay: string;

  mode: ImmunizationMode;
  status: 'completed' | 'not-done';

  drugUuid: string | null;
  drugDisplay: string | null;
  drugNonCoded: string;

  doseSequence: number | null;
  administeredOn: Date | null;
  locationUuid: string | null;
  locationDisplay: string | null;
  locationText: string;
  routeConceptUuid: string | null;
  routeDisplay: string | null;
  siteConceptUuid: string | null;
  siteDisplay: string | null;
  manufacturer: string;
  batchNumber: string;
  expirationDate: Date | null;
  notes: string;

  orderUuid: string | null;

  statusReasonConceptUuid: string | null;
  statusReasonDisplay: string | null;

  errors: Record<string, string>;
  hasBeenValidated: boolean;
}

export interface ImmunizationConceptFilterResult {
  displayName: string;
  concept?: {
    uuid: string;
    name: string;
  };
  disabled: boolean;
}

export interface ImmunizationDrugFilterResult {
  displayName: string;
  drugUuid?: string;
  disabled: boolean;
}
