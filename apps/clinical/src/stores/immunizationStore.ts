import { create } from 'zustand';
import {
  ImmunizationInputEntry,
  ImmunizationMode,
  FieldConfig,
  FieldConfigKey,
} from '../models/immunization';
import { ImmunizationFormConfig } from '../providers/clinicalConfig/models';
import { resolveFieldConfig } from '../utils/immunizationFieldConfig';

export interface ImmunizationState {
  selectedImmunizations: ImmunizationInputEntry[];

  addImmunization: (
    vaccineConceptUuid: string,
    vaccineDisplay: string,
    mode: ImmunizationMode,
  ) => void;
  removeImmunization: (id: string) => void;

  updateDoseSequence: (id: string, value: number | null) => void;
  updateDrug: (
    id: string,
    drugUuid: string | null,
    drugDisplay: string | null,
  ) => void;
  updateDrugNonCoded: (id: string, value: string) => void;
  updateAdministeredOn: (id: string, date: Date | null) => void;
  updateLocation: (
    id: string,
    uuid: string | null,
    display: string | null,
  ) => void;
  updateLocationText: (id: string, value: string) => void;
  updateRoute: (
    id: string,
    uuid: string | null,
    display: string | null,
  ) => void;
  updateSite: (
    id: string,
    uuid: string | null,
    display: string | null,
  ) => void;
  updateManufacturer: (id: string, value: string) => void;
  updateBatchNumber: (id: string, value: string) => void;
  updateExpirationDate: (id: string, date: Date | null) => void;
  updateNotes: (id: string, value: string) => void;

  updateStatus: (id: string, status: 'completed' | 'not-done') => void;
  updateStatusReason: (
    id: string,
    uuid: string | null,
    display: string | null,
  ) => void;
  updateOrderUuid: (id: string, orderUuid: string | null) => void;

  validateAll: (immunizationFormConfig?: ImmunizationFormConfig) => boolean;
  reset: () => void;
  getState: () => ImmunizationState;
}

const STATUS_FOR_MODE: Record<ImmunizationMode, 'completed' | 'not-done'> = {
  history: 'completed',
  'not-done': 'not-done',
  administration: 'completed',
};

const createDefaultEntry = (
  vaccineConceptUuid: string,
  vaccineDisplay: string,
  mode: ImmunizationMode,
): ImmunizationInputEntry => ({
  id: crypto.randomUUID(),
  vaccineConceptUuid,
  vaccineDisplay,
  mode,
  status: STATUS_FOR_MODE[mode],
  doseSequence: null,
  drugUuid: null,
  drugDisplay: null,
  drugNonCoded: '',
  administeredOn: null,
  locationUuid: null,
  locationDisplay: null,
  locationText: '',
  routeConceptUuid: null,
  routeDisplay: null,
  siteConceptUuid: null,
  siteDisplay: null,
  manufacturer: '',
  batchNumber: '',
  expirationDate: null,
  notes: '',
  orderUuid: null,
  statusReasonConceptUuid: null,
  statusReasonDisplay: null,
  errors: {},
  hasBeenValidated: false,
});

const updateEntry = (
  entries: ImmunizationInputEntry[],
  id: string,
  updater: (entry: ImmunizationInputEntry) => Partial<ImmunizationInputEntry>,
): ImmunizationInputEntry[] =>
  entries.map((entry) => {
    if (entry.id !== id) return entry;

    const updates = updater(entry);
    const updated = { ...entry, ...updates };

    if (entry.hasBeenValidated) {
      const errors = { ...updated.errors };
      for (const key of Object.keys(updates)) {
        if (key !== 'errors' && key !== 'hasBeenValidated') {
          delete errors[key];
        }
      }
      updated.errors = errors;
    }

    return updated;
  });

const FIELD_TO_ENTRY_KEY: Record<FieldConfigKey, keyof ImmunizationInputEntry> = {
  doseSequence: 'doseSequence',
  drug: 'drugUuid',
  administeredOn: 'administeredOn',
  location: 'locationUuid',
  route: 'routeConceptUuid',
  site: 'siteConceptUuid',
  manufacturer: 'manufacturer',
  batchNumber: 'batchNumber',
  expirationDate: 'expirationDate',
  notes: 'notes',
  statusReason: 'statusReasonConceptUuid',
};

function isFieldEmpty(entry: ImmunizationInputEntry, field: FieldConfigKey): boolean {
  if (field === 'drug') {
    return !entry.drugUuid && entry.drugNonCoded.trim() === '';
  }
  if (field === 'location') {
    return !entry.locationUuid && entry.locationText.trim() === '';
  }
  const key = FIELD_TO_ENTRY_KEY[field];
  const value = entry[key];
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  return false;
}

function validateEntry(
  entry: ImmunizationInputEntry,
  fieldConfig: FieldConfig,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  for (const [field, behavior] of Object.entries(fieldConfig) as [FieldConfigKey, string][]) {
    if (behavior === 'required' && isFieldEmpty(entry, field)) {
      const errorKey = field === 'statusReason' ? 'DROPDOWN_VALUE_REQUIRED' : 'INPUT_VALUE_REQUIRED';
      errors[field] = errorKey;
    }
  }

  if (
    fieldConfig.administeredOn &&
    fieldConfig.administeredOn !== 'hidden' &&
    entry.administeredOn &&
    entry.administeredOn > today
  ) {
    errors.administeredOn = 'IMMUNIZATION_DATE_FUTURE_ERROR';
  }

  return errors;
}

export const useImmunizationStore = create<ImmunizationState>((set, get) => ({
  selectedImmunizations: [],

  addImmunization: (
    vaccineConceptUuid: string,
    vaccineDisplay: string,
    mode: ImmunizationMode,
  ) => {
    set((state) => ({
      selectedImmunizations: [
        createDefaultEntry(vaccineConceptUuid, vaccineDisplay, mode),
        ...state.selectedImmunizations,
      ],
    }));
  },

  removeImmunization: (id: string) => {
    set((state) => ({
      selectedImmunizations: state.selectedImmunizations.filter(
        (entry) => entry.id !== id,
      ),
    }));
  },

  updateDoseSequence: (id: string, value: number | null) => {
    set((state) => ({
      selectedImmunizations: updateEntry(
        state.selectedImmunizations,
        id,
        () => ({ doseSequence: value }),
      ),
    }));
  },

  updateDrug: (
    id: string,
    drugUuid: string | null,
    drugDisplay: string | null,
  ) => {
    set((state) => ({
      selectedImmunizations: updateEntry(
        state.selectedImmunizations,
        id,
        () => ({ drugUuid, drugDisplay, drugNonCoded: '' }),
      ),
    }));
  },

  updateDrugNonCoded: (id: string, value: string) => {
    set((state) => ({
      selectedImmunizations: updateEntry(
        state.selectedImmunizations,
        id,
        () => ({ drugNonCoded: value, drugUuid: null, drugDisplay: null }),
      ),
    }));
  },

  updateAdministeredOn: (id: string, date: Date | null) => {
    set((state) => ({
      selectedImmunizations: updateEntry(
        state.selectedImmunizations,
        id,
        () => ({ administeredOn: date }),
      ),
    }));
  },

  updateLocation: (
    id: string,
    uuid: string | null,
    display: string | null,
  ) => {
    set((state) => ({
      selectedImmunizations: updateEntry(
        state.selectedImmunizations,
        id,
        () => ({ locationUuid: uuid, locationDisplay: display, locationText: '' }),
      ),
    }));
  },

  updateLocationText: (id: string, value: string) => {
    set((state) => ({
      selectedImmunizations: updateEntry(
        state.selectedImmunizations,
        id,
        () => ({ locationText: value, locationUuid: null, locationDisplay: null }),
      ),
    }));
  },

  updateRoute: (id: string, uuid: string | null, display: string | null) => {
    set((state) => ({
      selectedImmunizations: updateEntry(
        state.selectedImmunizations,
        id,
        () => ({ routeConceptUuid: uuid, routeDisplay: display }),
      ),
    }));
  },

  updateSite: (id: string, uuid: string | null, display: string | null) => {
    set((state) => ({
      selectedImmunizations: updateEntry(
        state.selectedImmunizations,
        id,
        () => ({ siteConceptUuid: uuid, siteDisplay: display }),
      ),
    }));
  },

  updateManufacturer: (id: string, value: string) => {
    set((state) => ({
      selectedImmunizations: updateEntry(
        state.selectedImmunizations,
        id,
        () => ({ manufacturer: value }),
      ),
    }));
  },

  updateBatchNumber: (id: string, value: string) => {
    set((state) => ({
      selectedImmunizations: updateEntry(
        state.selectedImmunizations,
        id,
        () => ({ batchNumber: value }),
      ),
    }));
  },

  updateExpirationDate: (id: string, date: Date | null) => {
    set((state) => ({
      selectedImmunizations: updateEntry(
        state.selectedImmunizations,
        id,
        () => ({ expirationDate: date }),
      ),
    }));
  },

  updateNotes: (id: string, value: string) => {
    set((state) => ({
      selectedImmunizations: updateEntry(
        state.selectedImmunizations,
        id,
        () => ({ notes: value }),
      ),
    }));
  },

  updateStatus: (id: string, status: 'completed' | 'not-done') => {
    set((state) => ({
      selectedImmunizations: updateEntry(
        state.selectedImmunizations,
        id,
        () => ({ status }),
      ),
    }));
  },

  updateStatusReason: (
    id: string,
    uuid: string | null,
    display: string | null,
  ) => {
    set((state) => ({
      selectedImmunizations: updateEntry(
        state.selectedImmunizations,
        id,
        () => ({
          statusReasonConceptUuid: uuid,
          statusReasonDisplay: display,
        }),
      ),
    }));
  },

  updateOrderUuid: (id: string, orderUuid: string | null) => {
    set((state) => ({
      selectedImmunizations: updateEntry(
        state.selectedImmunizations,
        id,
        () => ({ orderUuid }),
      ),
    }));
  },

  validateAll: (immunizationFormConfig?: ImmunizationFormConfig) => {
    let isValid = true;

    const resolvedConfigs: Record<ImmunizationMode, FieldConfig> = {
      history: resolveFieldConfig('history', immunizationFormConfig?.history?.fieldConfig),
      'not-done': resolveFieldConfig('not-done', immunizationFormConfig?.notDone?.fieldConfig),
      administration: resolveFieldConfig('administration', immunizationFormConfig?.administration?.fieldConfig),
    };

    set((state) => ({
      selectedImmunizations: state.selectedImmunizations.map((entry) => {
        const fieldConfig = resolvedConfigs[entry.mode];
        const errors = validateEntry(entry, fieldConfig);

        if (Object.keys(errors).length > 0) {
          isValid = false;
        }

        return { ...entry, errors, hasBeenValidated: true };
      }),
    }));

    return isValid;
  },

  reset: () => {
    set({ selectedImmunizations: [] });
  },

  getState: () => get(),
}));

export default useImmunizationStore;
