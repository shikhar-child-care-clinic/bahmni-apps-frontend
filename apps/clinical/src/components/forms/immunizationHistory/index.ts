import type { EncounterContext } from '../models';
import { registerInputControl } from '../registry';
import {
  IMMUNIZATION_ADMINISTRATION_INPUT_CONTROL_KEY,
  IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY,
} from './constants';
import ImmunizationHistoryForm from './ImmunizationHistoryForm';
import { useImmunizationHistoryStore } from './stores';
import { createImmunizationBundleEntries } from './utils';

const immunizationHistoryEntry = {
  component: ImmunizationHistoryForm,
  reset: () => useImmunizationHistoryStore.getState().reset(),
  validate: () => useImmunizationHistoryStore.getState().validateAll(),
  hasData: () =>
    useImmunizationHistoryStore.getState().selectedImmunizations.length > 0,
  subscribe: (cb: () => void) => useImmunizationHistoryStore.subscribe(cb),
  createBundleEntries: (ctx: EncounterContext) =>
    createImmunizationBundleEntries({
      selectedImmunizations:
        useImmunizationHistoryStore.getState().selectedImmunizations,
      encounterSubject: ctx.encounterSubject,
      encounterReference: ctx.encounterReference,
      practitionerUUID: ctx.practitionerUUID,
    }),
};

registerInputControl({
  key: IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY,
  ...immunizationHistoryEntry,
});

registerInputControl({
  key: IMMUNIZATION_ADMINISTRATION_INPUT_CONTROL_KEY,
  ...immunizationHistoryEntry,
});

export { default } from './ImmunizationHistoryForm';
