import {
  Immunization,
  Reference,
  ImmunizationPerformer,
  Extension,
} from 'fhir/r4';
import { ImmunizationInputEntry } from '../../models/immunization';
import { createCodeableConcept, createCoding } from './codeableConceptCreator';

const FHIR_EXT_IMMUNIZATION_ADMINISTERED_PRODUCT =
  'http://fhir.bahmni.org/ext/immunization/administeredProduct';
const FHIR_EXT_IMMUNIZATION_BASED_ON =
  'http://fhir.bahmni.org/ext/immunization/basedOn';
const PERFORMER_FUNCTION_SYSTEM =
  'http://terminology.hl7.org/CodeSystem/v2-0443';

export const createImmunizationResource = (
  entry: ImmunizationInputEntry,
  subjectReference: Reference,
  encounterReference: Reference,
  practitionerReference: Reference,
): Immunization => {
  const immunization: Immunization = {
    resourceType: 'Immunization',
    status: entry.status === 'completed' ? 'completed' : 'not-done',
    vaccineCode: createCodeableConcept(
      [createCoding(entry.vaccineConceptUuid)],
    ),
    patient: subjectReference,
    encounter: encounterReference,
    primarySource: entry.mode === 'administration',
  };

  if (entry.administeredOn) {
    immunization.occurrenceDateTime = entry.administeredOn.toISOString();
  }

  if (
    entry.status === 'not-done' &&
    entry.statusReasonConceptUuid
  ) {
    immunization.statusReason = createCodeableConcept(
      [createCoding(entry.statusReasonConceptUuid)],
    );
  }

  if (entry.locationUuid) {
    immunization.location = {
      reference: `Location/${entry.locationUuid}`,
    };
  } else if (entry.locationText) {
    immunization.location = {
      display: entry.locationText,
    };
  }

  if (entry.manufacturer) {
    immunization.manufacturer = {
      display: entry.manufacturer,
    };
  }

  if (entry.batchNumber) {
    immunization.lotNumber = entry.batchNumber;
  }

  if (entry.expirationDate) {
    immunization.expirationDate = entry.expirationDate.toISOString().split('T')[0];
  }

  if (entry.routeConceptUuid) {
    immunization.route = createCodeableConcept(
      [createCoding(entry.routeConceptUuid)],
    );
  }

  if (entry.siteConceptUuid) {
    immunization.site = createCodeableConcept(
      [createCoding(entry.siteConceptUuid)],
    );
  }

  const performers: ImmunizationPerformer[] = [
    {
      function: createCodeableConcept(
        [createCoding('AP', PERFORMER_FUNCTION_SYSTEM, 'Administering Provider')],
      ),
      actor: practitionerReference,
    },
  ];
  immunization.performer = performers;

  if (entry.doseSequence) {
    immunization.protocolApplied = [
      {
        doseNumberPositiveInt: entry.doseSequence,
      },
    ];
  }

  if (entry.notes) {
    immunization.note = [{ text: entry.notes }];
  }

  const extensions: Extension[] = [];

  if (entry.drugUuid) {
    extensions.push({
      url: FHIR_EXT_IMMUNIZATION_ADMINISTERED_PRODUCT,
      valueReference: {
        reference: `Medication/${entry.drugUuid}`,
      },
    });
  } else if (entry.drugNonCoded) {
    extensions.push({
      url: FHIR_EXT_IMMUNIZATION_ADMINISTERED_PRODUCT,
      valueReference: {
        display: entry.drugNonCoded,
      },
    });
  }

  if (entry.orderUuid) {
    extensions.push({
      url: FHIR_EXT_IMMUNIZATION_BASED_ON,
      valueReference: {
        reference: `MedicationRequest/${entry.orderUuid}`,
      },
    });
  }

  if (extensions.length > 0) {
    immunization.extension = extensions;
  }

  return immunization;
};
