import { MedicationDispense } from 'fhir/r4';

type WithMedicationCodeableConcept = {
  medicationCodeableConcept: NonNullable<
    MedicationDispense['medicationCodeableConcept']
  >;
  medicationReference?: never;
};

type WithMedicationReference = {
  medicationReference: NonNullable<MedicationDispense['medicationReference']>;
  medicationCodeableConcept?: never;
};

export type MedicationDispenseBundleEntryInput = (
  | WithMedicationCodeableConcept
  | WithMedicationReference
) & {
  status: MedicationDispense['status'];
  fullUrl?: string;
  id?: string;
  meta?: MedicationDispense['meta'];
  identifier?: MedicationDispense['identifier'];
  partOf?: MedicationDispense['partOf'];
  statusReasonCodeableConcept?: MedicationDispense['statusReasonCodeableConcept'];
  statusReasonReference?: MedicationDispense['statusReasonReference'];
  category?: MedicationDispense['category'];
  subject?: MedicationDispense['subject'];
  context?: MedicationDispense['context'];
  supportingInformation?: MedicationDispense['supportingInformation'];
  performer?: MedicationDispense['performer'];
  location?: MedicationDispense['location'];
  authorizingPrescription?: MedicationDispense['authorizingPrescription'];
  type?: MedicationDispense['type'];
  quantity?: MedicationDispense['quantity'];
  daysSupply?: MedicationDispense['daysSupply'];
  whenPrepared?: MedicationDispense['whenPrepared'];
  whenHandedOver?: MedicationDispense['whenHandedOver'];
  destination?: MedicationDispense['destination'];
  receiver?: MedicationDispense['receiver'];
  note?: MedicationDispense['note'];
  dosageInstruction?: MedicationDispense['dosageInstruction'];
  substitution?: MedicationDispense['substitution'];
  detectedIssue?: MedicationDispense['detectedIssue'];
  eventHistory?: MedicationDispense['eventHistory'];
};
