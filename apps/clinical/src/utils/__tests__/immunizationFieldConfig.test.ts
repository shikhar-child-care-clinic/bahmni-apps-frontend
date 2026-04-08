import {
  HISTORY_FIELD_CONFIG_DEFAULTS,
  NOT_DONE_FIELD_CONFIG_DEFAULTS,
  ADMINISTRATION_FIELD_CONFIG_DEFAULTS,
} from '../../constants/immunization';
import { FieldConfig } from '../../models/immunization';
import {
  resolveFieldConfig,
  getFieldBehavior,
  isFieldVisible,
  isFieldRequired,
  isFieldReadonly,
} from '../immunizationFieldConfig';

describe('resolveFieldConfig', () => {
  it('should return a copy of the mode defaults when no overrides are given', () => {
    const result = resolveFieldConfig('history');
    expect(result).toEqual(HISTORY_FIELD_CONFIG_DEFAULTS);
    expect(result).not.toBe(HISTORY_FIELD_CONFIG_DEFAULTS);
  });

  it('should return not-done defaults for not-done mode', () => {
    const result = resolveFieldConfig('not-done');
    expect(result).toEqual(NOT_DONE_FIELD_CONFIG_DEFAULTS);
  });

  it('should return administration defaults for administration mode', () => {
    const result = resolveFieldConfig('administration');
    expect(result).toEqual(ADMINISTRATION_FIELD_CONFIG_DEFAULTS);
  });

  it('should merge overrides on top of defaults', () => {
    const overrides: FieldConfig = {
      administeredOn: 'hidden',
      notes: 'required',
    };
    const result = resolveFieldConfig('history', overrides);
    expect(result.administeredOn).toBe('hidden');
    expect(result.notes).toBe('required');
    expect(result.drug).toBe(HISTORY_FIELD_CONFIG_DEFAULTS.drug);
  });

  it('should not mutate the defaults when overrides are applied', () => {
    const overrides: FieldConfig = { administeredOn: 'hidden' };
    resolveFieldConfig('history', overrides);
    expect(HISTORY_FIELD_CONFIG_DEFAULTS.administeredOn).toBe('required');
  });

  it('should allow overrides to add fields not in the defaults', () => {
    const overrides: FieldConfig = { statusReason: 'required' };
    const result = resolveFieldConfig('history', overrides);
    expect(result.statusReason).toBe('required');
  });
});

describe('getFieldBehavior', () => {
  it('should return the behavior for a field present in the config', () => {
    const config: FieldConfig = {
      administeredOn: 'required',
      notes: 'visible',
    };
    expect(getFieldBehavior(config, 'administeredOn')).toBe('required');
    expect(getFieldBehavior(config, 'notes')).toBe('visible');
  });

  it('should return hidden for a field absent from the config', () => {
    const config: FieldConfig = { notes: 'visible' };
    expect(getFieldBehavior(config, 'drug')).toBe('hidden');
  });
});

describe('isFieldVisible', () => {
  it('should return true for visible behavior', () => {
    expect(isFieldVisible({ notes: 'visible' }, 'notes')).toBe(true);
  });

  it('should return true for required behavior', () => {
    expect(
      isFieldVisible({ administeredOn: 'required' }, 'administeredOn'),
    ).toBe(true);
  });

  it('should return true for readonly behavior', () => {
    expect(isFieldVisible({ location: 'readonly' }, 'location')).toBe(true);
  });

  it('should return false for hidden behavior', () => {
    expect(isFieldVisible({ drug: 'hidden' }, 'drug')).toBe(false);
  });

  it('should return false when the field is absent from the config', () => {
    expect(isFieldVisible({}, 'drug')).toBe(false);
  });
});

describe('isFieldRequired', () => {
  it('should return true when behavior is required', () => {
    expect(
      isFieldRequired({ administeredOn: 'required' }, 'administeredOn'),
    ).toBe(true);
  });

  it('should return false for visible behavior', () => {
    expect(isFieldRequired({ notes: 'visible' }, 'notes')).toBe(false);
  });

  it('should return false for readonly behavior', () => {
    expect(isFieldRequired({ location: 'readonly' }, 'location')).toBe(false);
  });

  it('should return false when the field is absent', () => {
    expect(isFieldRequired({}, 'drug')).toBe(false);
  });
});

describe('isFieldReadonly', () => {
  it('should return true when behavior is readonly', () => {
    expect(isFieldReadonly({ location: 'readonly' }, 'location')).toBe(true);
  });

  it('should return false for visible behavior', () => {
    expect(isFieldReadonly({ notes: 'visible' }, 'notes')).toBe(false);
  });

  it('should return false for required behavior', () => {
    expect(
      isFieldReadonly({ administeredOn: 'required' }, 'administeredOn'),
    ).toBe(false);
  });

  it('should return false when the field is absent', () => {
    expect(isFieldReadonly({}, 'location')).toBe(false);
  });
});
