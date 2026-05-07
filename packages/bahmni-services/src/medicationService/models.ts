import { Medication } from 'fhir/r4';

export type MedicationBundleEntryInput = {
  fullUrl?: string;
  id?: string;
  meta?: Medication['meta'];
  identifier?: Medication['identifier'];
  code?: Medication['code'];
  status?: Medication['status'];
  manufacturer?: Medication['manufacturer'];
  form?: Medication['form'];
  amount?: Medication['amount'];
  ingredient?: Medication['ingredient'];
  batch?: Medication['batch'];
};
