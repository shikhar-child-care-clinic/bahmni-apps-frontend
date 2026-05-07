import { BundleEntry, Medication } from 'fhir/r4';
import { MedicationBundleEntryInput } from './models';

/**
 * Builds a FHIR R4 `BundleEntry<Medication>` from the provided input fields.
 *
 * `fullUrl`, when supplied, is placed on the bundle entry wrapper rather than
 * the resource itself. All remaining fields are spread onto the `Medication`
 * resource alongside the fixed `resourceType`.
 *
 * @param input - Optional medication fields and an optional `fullUrl` for the bundle entry.
 * @returns A `BundleEntry<Medication>` ready for inclusion in a FHIR Bundle.
 */
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
