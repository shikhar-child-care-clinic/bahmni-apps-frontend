import {
  FieldConfig,
  FieldBehavior,
  FieldConfigKey,
  ImmunizationMode,
} from '../models/immunization';
import { MODE_FIELD_CONFIG_DEFAULTS } from '../constants/immunization';

export function resolveFieldConfig(
  mode: ImmunizationMode,
  overrides?: FieldConfig,
): FieldConfig {
  const defaults = MODE_FIELD_CONFIG_DEFAULTS[mode];
  if (!overrides) return { ...defaults };
  return { ...defaults, ...overrides };
}

export function getFieldBehavior(
  fieldConfig: FieldConfig,
  field: FieldConfigKey,
): FieldBehavior {
  return fieldConfig[field] ?? 'hidden';
}

export function isFieldVisible(
  fieldConfig: FieldConfig,
  field: FieldConfigKey,
): boolean {
  const behavior = getFieldBehavior(fieldConfig, field);
  return behavior !== 'hidden';
}

export function isFieldRequired(
  fieldConfig: FieldConfig,
  field: FieldConfigKey,
): boolean {
  return getFieldBehavior(fieldConfig, field) === 'required';
}

export function isFieldReadonly(
  fieldConfig: FieldConfig,
  field: FieldConfigKey,
): boolean {
  return getFieldBehavior(fieldConfig, field) === 'readonly';
}
