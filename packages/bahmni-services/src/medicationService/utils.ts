import { BundleEntry, Medication } from 'fhir/r4';
import { MedicationBundleEntryInput } from './models';

export function createMedicationBundleEntry(
  input: MedicationBundleEntryInput = {},
): BundleEntry<Medication> {
  const { fullUrl, ...medicationFields } = input;

  const resource: Medication = {
    resourceType: 'Medication',
    ...medicationFields,
  };

  return {
    ...(fullUrl !== undefined && { fullUrl }),
    resource,
  };
}
