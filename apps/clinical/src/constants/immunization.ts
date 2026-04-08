import { FieldConfig, ImmunizationMode } from '../models/immunization';

export const HISTORY_FIELD_CONFIG_DEFAULTS: FieldConfig = {
  doseSequence: 'visible',
  drug: 'visible',
  administeredOn: 'required',
  location: 'visible',
  route: 'visible',
  site: 'visible',
  manufacturer: 'visible',
  batchNumber: 'visible',
  expirationDate: 'visible',
  notes: 'visible',
};

export const NOT_DONE_FIELD_CONFIG_DEFAULTS: FieldConfig = {
  statusReason: 'required',
  notes: 'visible',
};

export const ADMINISTRATION_FIELD_CONFIG_DEFAULTS: FieldConfig = {
  doseSequence: 'visible',
  drug: 'required',
  administeredOn: 'required',
  location: 'readonly',
  route: 'visible',
  site: 'visible',
  manufacturer: 'visible',
  batchNumber: 'required',
  expirationDate: 'required',
  notes: 'visible',
};

export const MODE_FIELD_CONFIG_DEFAULTS: Record<ImmunizationMode, FieldConfig> = {
  history: HISTORY_FIELD_CONFIG_DEFAULTS,
  'not-done': NOT_DONE_FIELD_CONFIG_DEFAULTS,
  administration: ADMINISTRATION_FIELD_CONFIG_DEFAULTS,
};
