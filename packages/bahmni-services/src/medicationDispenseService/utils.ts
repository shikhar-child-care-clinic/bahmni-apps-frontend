import { BundleEntry, MedicationDispense } from 'fhir/r4';
import { MedicationDispenseBundleEntryInput } from './models';

/**
 * Builds a FHIR R4 `BundleEntry<MedicationDispense>` from the provided input fields.
 *
 * Exactly one of `medicationCodeableConcept` or `medicationReference` must be
 * supplied (enforced by the discriminated-union type of `input`). The cast
 * inside the implementation widens the union so both optional properties can be
 * destructured together before conditional spreading onto the resource.
 *
 * @param input - Dispense fields including mandatory `status` and one medication
 *   identifier, plus an optional `fullUrl` for the bundle entry.
 * @returns A `BundleEntry<MedicationDispense>` ready for inclusion in a FHIR Bundle.
 */
export function createMedicationDispenseBundleEntry(
  input: MedicationDispenseBundleEntryInput,
): BundleEntry<MedicationDispense> {
  const { fullUrl, medicationCodeableConcept, medicationReference, ...rest } =
    input as MedicationDispenseBundleEntryInput & {
      medicationCodeableConcept?: MedicationDispense['medicationCodeableConcept'];
      medicationReference?: MedicationDispense['medicationReference'];
    };

  const resource: MedicationDispense = {
    resourceType: 'MedicationDispense',
    ...(medicationCodeableConcept !== undefined && {
      medicationCodeableConcept,
    }),
    ...(medicationReference !== undefined && { medicationReference }),
    ...rest,
  };

  return {
    ...(fullUrl !== undefined && { fullUrl }),
    resource,
  };
}
