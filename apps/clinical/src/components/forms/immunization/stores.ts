import { generateUUID } from '@bahmni/services';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { InputControlAttributes } from '../../../providers/clinicalConfig/models';
import {
  ImmunizationDrug,
  ImmunizationHistoryState,
  ImmunizationInputEntry,
  ImmunizationLocation,
  ImmunizationStoreKey,
} from './models';
import { findAttr } from './utils';

type ImmunizationHistoryStoreApi = ReturnType<
  typeof createImmunizationHistoryStore
>;

const storeRegistry = new Map<
  ImmunizationStoreKey,
  ImmunizationHistoryStoreApi
>();

function applyAdministeredOnUpdate(
  entry: ImmunizationInputEntry,
  value: Date | null,
): ImmunizationInputEntry {
  const updated = { ...entry, administeredOn: value };
  if (entry.hasBeenValidated) {
    updated.errors = { ...entry.errors };
    if (value) delete updated.errors.administeredOn;
    if (entry.expiryDate) {
      if (value && entry.expiryDate < value) {
        updated.errors.expiryDate =
          'IMMUNIZATION_INPUT_CONTROL_EXPIRY_DATE_BEFORE_ADMINISTERED_ON';
      } else {
        delete updated.errors.expiryDate;
      }
    }
  }
  return updated;
}

function applyVaccineDrugUpdate(
  entry: ImmunizationInputEntry,
  drug: ImmunizationDrug | null,
): ImmunizationInputEntry {
  const updated = { ...entry, drug };
  if (entry.hasBeenValidated && drug?.display.trim()) {
    updated.errors = { ...entry.errors };
    delete updated.errors.drug;
  }
  return updated;
}

function applyAdministeredLocationUpdate(
  entry: ImmunizationInputEntry,
  value: ImmunizationLocation | null,
): ImmunizationInputEntry {
  const updated = { ...entry, administeredLocation: value };
  if (entry.hasBeenValidated && value?.display.trim()) {
    updated.errors = { ...entry.errors };
    delete updated.errors.administeredLocation;
  }
  return updated;
}

function applyRouteUpdate(
  entry: ImmunizationInputEntry,
  value: string,
): ImmunizationInputEntry {
  const updated = { ...entry, route: value };
  if (entry.hasBeenValidated && value) {
    updated.errors = { ...entry.errors };
    delete updated.errors.route;
  }
  return updated;
}

function applySiteUpdate(
  entry: ImmunizationInputEntry,
  value: string,
): ImmunizationInputEntry {
  const updated = { ...entry, site: value };
  if (entry.hasBeenValidated && value) {
    updated.errors = { ...entry.errors };
    delete updated.errors.site;
  }
  return updated;
}

function applyExpiryDateUpdate(
  entry: ImmunizationInputEntry,
  value: Date | null,
): ImmunizationInputEntry {
  const updated = { ...entry, expiryDate: value };
  if (entry.hasBeenValidated) {
    updated.errors = { ...entry.errors };
    if (!value) {
      if (
        updated.errors.expiryDate ===
        'IMMUNIZATION_INPUT_CONTROL_EXPIRY_DATE_BEFORE_ADMINISTERED_ON'
      ) {
        delete updated.errors.expiryDate;
      }
    } else if (entry.administeredOn && value < entry.administeredOn) {
      updated.errors.expiryDate =
        'IMMUNIZATION_INPUT_CONTROL_EXPIRY_DATE_BEFORE_ADMINISTERED_ON';
    } else {
      delete updated.errors.expiryDate;
    }
  }
  return updated;
}

function applyManufacturerUpdate(
  entry: ImmunizationInputEntry,
  value: string,
): ImmunizationInputEntry {
  const updated = { ...entry, manufacturer: value };
  if (entry.hasBeenValidated && value.trim()) {
    updated.errors = { ...entry.errors };
    delete updated.errors.manufacturer;
  }
  return updated;
}

function applyBatchNumberUpdate(
  entry: ImmunizationInputEntry,
  value: string,
): ImmunizationInputEntry {
  const updated = { ...entry, batchNumber: value };
  if (entry.hasBeenValidated && value.trim()) {
    updated.errors = { ...entry.errors };
    delete updated.errors.batchNumber;
  }
  return updated;
}

function applyNoteUpdate(
  entry: ImmunizationInputEntry,
  value: string,
): ImmunizationInputEntry {
  const updated = { ...entry, note: value };
  if (entry.hasBeenValidated && value.trim()) {
    updated.errors = { ...entry.errors };
    delete updated.errors.note;
  }
  return updated;
}

function applyDoseSequenceUpdate(
  entry: ImmunizationInputEntry,
  sanitized: number | null,
): ImmunizationInputEntry {
  const updated = { ...entry, doseSequence: sanitized };
  if (entry.hasBeenValidated && sanitized !== null && sanitized >= 1) {
    updated.errors = { ...entry.errors };
    delete updated.errors.doseSequence;
  }
  return updated;
}

type FieldValidationConfig = {
  attr: string;
  key: keyof ImmunizationInputEntry['errors'];
  errorMsg: string;
  hasValue: (entry: ImmunizationInputEntry) => boolean;
};

const FIELD_VALIDATIONS: FieldValidationConfig[] = [
  {
    attr: 'drug',
    key: 'drug',
    errorMsg: 'IMMUNIZATION_INPUT_CONTROL_DRUG_CODE_REQUIRED',
    hasValue: (e) => Boolean(e.drug),
  },
  {
    attr: 'administeredOn',
    key: 'administeredOn',
    errorMsg: 'IMMUNIZATION_INPUT_CONTROL_ADMINISTERED_ON_REQUIRED',
    hasValue: (e) => Boolean(e.administeredOn),
  },
  {
    attr: 'administeredLocation',
    key: 'administeredLocation',
    errorMsg: 'IMMUNIZATION_INPUT_CONTROL_ADMINISTERED_LOCATION_REQUIRED',
    hasValue: (e) => Boolean(e.administeredLocation?.display.trim()),
  },
  {
    attr: 'route',
    key: 'route',
    errorMsg: 'IMMUNIZATION_INPUT_CONTROL_ROUTE_REQUIRED',
    hasValue: (e) => Boolean(e.route?.trim()),
  },
  {
    attr: 'site',
    key: 'site',
    errorMsg: 'IMMUNIZATION_INPUT_CONTROL_SITE_REQUIRED',
    hasValue: (e) => Boolean(e.site?.trim()),
  },
  {
    attr: 'expiryDate',
    key: 'expiryDate',
    errorMsg: 'IMMUNIZATION_INPUT_CONTROL_EXPIRY_DATE_REQUIRED',
    hasValue: (e) => Boolean(e.expiryDate),
  },
  {
    attr: 'manufacturer',
    key: 'manufacturer',
    errorMsg: 'IMMUNIZATION_INPUT_CONTROL_MANUFACTURER_REQUIRED',
    hasValue: (e) => Boolean(e.manufacturer?.trim()),
  },
  {
    attr: 'batchNumber',
    key: 'batchNumber',
    errorMsg: 'IMMUNIZATION_INPUT_CONTROL_BATCH_NUMBER_REQUIRED',
    hasValue: (e) => Boolean(e.batchNumber?.trim()),
  },
  {
    attr: 'doseSequence',
    key: 'doseSequence',
    errorMsg: 'IMMUNIZATION_INPUT_CONTROL_DOSE_SEQUENCE_REQUIRED',
    hasValue: (e) => e.doseSequence !== null && e.doseSequence >= 1,
  },
  {
    attr: 'note',
    key: 'note',
    errorMsg: 'IMMUNIZATION_INPUT_CONTROL_NOTE_REQUIRED',
    hasValue: (e) => Boolean(e.note?.trim()),
  },
];

function validateEntry(
  entry: ImmunizationInputEntry,
  attributes: InputControlAttributes[] | undefined,
): { entry: ImmunizationInputEntry; valid: boolean } {
  const errors = { ...entry.errors };
  let valid = true;

  for (const field of FIELD_VALIDATIONS) {
    if (findAttr(field.attr, attributes)?.required) {
      if (field.hasValue(entry)) delete errors[field.key];
      else {
        errors[field.key] = field.errorMsg;
        valid = false;
      }
    }
  }

  if (
    entry.expiryDate &&
    entry.administeredOn &&
    entry.expiryDate < entry.administeredOn
  ) {
    errors.expiryDate =
      'IMMUNIZATION_INPUT_CONTROL_EXPIRY_DATE_BEFORE_ADMINISTERED_ON';
    valid = false;
  }

  return { entry: { ...entry, errors, hasBeenValidated: true }, valid };
}

function createImmunizationHistoryStore() {
  return createStore<ImmunizationHistoryState>((set, get) => ({
    selectedImmunizations: [],
    attributes: undefined,

    addImmunization: (vaccineCode: { code: string; display: string }) => {
      const newEntry: ImmunizationInputEntry = {
        id: generateUUID(),
        drug: null,
        vaccineCode,
        administeredOn: null,
        administeredLocation: null,
        route: null,
        site: null,
        expiryDate: null,
        manufacturer: null,
        batchNumber: null,
        doseSequence: null,
        errors: {},
        hasBeenValidated: false,
      };
      set((state) => ({
        selectedImmunizations: [newEntry, ...state.selectedImmunizations],
      }));
    },

    addImmunizationWithDefaults: (
      vaccineCode: { code: string; display: string },
      defaults: {
        basedOnReference?: string | null;
        drug: ImmunizationDrug | null;
        administeredOn: Date | null;
        administeredLocation: ImmunizationLocation | null;
      },
    ) => {
      const newEntry: ImmunizationInputEntry = {
        id: generateUUID(),
        drug: defaults.drug,
        vaccineCode,
        administeredOn: defaults.administeredOn,
        administeredLocation: defaults.administeredLocation,
        route: null,
        site: null,
        expiryDate: null,
        manufacturer: null,
        batchNumber: null,
        doseSequence: null,
        basedOnReference: defaults.basedOnReference,
        errors: {},
        hasBeenValidated: false,
      };
      set((state) => ({
        selectedImmunizations: [newEntry, ...state.selectedImmunizations],
      }));
    },

    removeImmunization: (id: string) => {
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.filter(
          (e) => e.id !== id,
        ),
      }));
    },

    setAttributes: (attrs: InputControlAttributes[]) => {
      set({ attributes: attrs });
    },

    updateAdministeredOn: (id: string, value: Date | null) => {
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map((entry) =>
          entry.id === id ? applyAdministeredOnUpdate(entry, value) : entry,
        ),
      }));
    },

    updateVaccineDrug: (id: string, drug: ImmunizationDrug | null) => {
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map((entry) =>
          entry.id === id ? applyVaccineDrugUpdate(entry, drug) : entry,
        ),
      }));
    },

    updateAdministeredLocation: (
      id: string,
      value: ImmunizationLocation | null,
    ) => {
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map((entry) =>
          entry.id === id
            ? applyAdministeredLocationUpdate(entry, value)
            : entry,
        ),
      }));
    },

    updateRoute: (id: string, value: string) => {
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map((entry) =>
          entry.id === id ? applyRouteUpdate(entry, value) : entry,
        ),
      }));
    },

    updateSite: (id: string, value: string) => {
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map((entry) =>
          entry.id === id ? applySiteUpdate(entry, value) : entry,
        ),
      }));
    },

    updateExpiryDate: (id: string, value: Date | null) => {
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map((entry) =>
          entry.id === id ? applyExpiryDateUpdate(entry, value) : entry,
        ),
      }));
    },

    updateManufacturer: (id: string, value: string) => {
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map((entry) =>
          entry.id === id ? applyManufacturerUpdate(entry, value) : entry,
        ),
      }));
    },

    updateBatchNumber: (id: string, value: string) => {
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map((entry) =>
          entry.id === id ? applyBatchNumberUpdate(entry, value) : entry,
        ),
      }));
    },

    updateDoseSequence: (id: string, value: number | null) => {
      const sanitized = value === null ? null : Math.max(0, Math.floor(value));
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map((entry) =>
          entry.id === id ? applyDoseSequenceUpdate(entry, sanitized) : entry,
        ),
      }));
    },

    updateNote: (id: string, value: string) => {
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map((entry) =>
          entry.id === id ? applyNoteUpdate(entry, value) : entry,
        ),
      }));
    },

    validateAll: () => {
      const { attributes } = get();
      let isValid = true;
      set((state) => {
        const validated = state.selectedImmunizations.map((entry) => {
          const result = validateEntry(entry, attributes);
          if (!result.valid) isValid = false;
          return result.entry;
        });
        return { selectedImmunizations: validated };
      });
      return isValid;
    },

    reset: () => {
      set({ selectedImmunizations: [] });
    },

    getState: () => get(),
  }));
}

export function getImmunizationStore(
  key: ImmunizationStoreKey,
): ImmunizationHistoryStoreApi {
  if (!storeRegistry.has(key)) {
    storeRegistry.set(key, createImmunizationHistoryStore());
  }
  return storeRegistry.get(key)!;
}

export function useImmunizationHistoryStore(
  key: ImmunizationStoreKey,
): ImmunizationHistoryState {
  return useStore(getImmunizationStore(key));
}
