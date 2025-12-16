import { ObservationDataInFormControls } from '@bahmni/services';
import { Observation, Reference } from 'fhir/r4';
import { createCodeableConcept, createCoding } from './codeableConceptCreator';

// Map interpretation values from form2-controls to FHIR codes
const INTERPRETATION_TO_CODE: Record<
  string,
  { code: string; display: string }
> = {
  ABNORMAL: { code: 'A', display: 'Abnormal' },
  NORMAL: { code: 'N', display: 'Normal' },
};

/**
 * Creates a FHIR R4 Observation resource from ObservationDataInFormControls
 * @param observationPayload - The observation data from form2-controls
 * @param subjectReference - Reference to the patient
 * @param encounterReference - Reference to the encounter
 * @param performerReference - Reference to the practitioner
 * @returns FHIR R4 Observation resource
 */
export const createObservationResource = (
  observationPayload: ObservationDataInFormControls,
  subjectReference: Reference,
  encounterReference: Reference,
  performerReference: Reference,
): Observation => {
  const observation: Observation = {
    resourceType: 'Observation',
    status: 'final',
    code: createCodeableConcept([
      createCoding(observationPayload.concept.uuid),
    ]),
    subject: subjectReference,
    encounter: encounterReference,
    performer: [performerReference],
    effectiveDateTime:
      observationPayload.obsDatetime ?? new Date().toISOString(),
  };

  const value = observationPayload.value;

  // For obsGroupControl (group parent observations), value is null
  // and only groupMembers are present - skip adding a value field
  if (value === null || value === undefined) {
    // No value field for group parent observations
  } else if (value instanceof Date) {
    // Date object - use valueDateTime
    observation.valueDateTime = value.toISOString();
  } else if (typeof value === 'number') {
    // Numeric value - use valueQuantity
    observation.valueQuantity = { value: value };
  } else if (typeof value === 'string') {
    const trimmedValue = value.trim();

    const isISODate = /^\d{4}-\d{2}-\d{2}/.test(trimmedValue);
    if (isISODate) {
      const dateValue = new Date(trimmedValue);
      if (!isNaN(dateValue.getTime())) {
        observation.valueDateTime = dateValue.toISOString();
        return observation;
      }
    }
    const numericValue = parseFloat(trimmedValue);
    if (!isNaN(numericValue) && trimmedValue !== '') {
      // String contains a numeric value - convert to valueQuantity
      observation.valueQuantity = { value: numericValue };
    } else if (trimmedValue !== '') {
      // Text string - use valueString
      observation.valueString = value;
    }
  } else if (typeof value === 'boolean') {
    // Boolean value - use valueBoolean
    observation.valueBoolean = value;
  } else if (value && typeof value === 'object' && 'uuid' in value) {
    // ConceptValue - coded answer - use valueCodeableConcept
    observation.valueCodeableConcept = createCodeableConcept([
      createCoding(value.uuid, undefined, value.display),
    ]);
  }

  // Add interpretation if provided (receives "ABNORMAL" or "NORMAL" from form2-controls)
  // If null/undefined, don't include interpretation field
  if (observationPayload.interpretation) {
    const interpretationValue = observationPayload.interpretation.toUpperCase();
    const mapping =
      INTERPRETATION_TO_CODE[interpretationValue] ||
      INTERPRETATION_TO_CODE.NORMAL;

    observation.interpretation = [
      {
        coding: [
          {
            system:
              'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
            code: mapping.code,
            display: mapping.display,
          },
        ],
      },
    ];
  }

  // Add form namespace path extension if both formNamespace and formFieldPath are provided
  if (observationPayload.formNamespace && observationPayload.formFieldPath) {
    observation.extension = [
      {
        url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
        valueString: `${observationPayload.formNamespace}^${observationPayload.formFieldPath}`,
      },
    ];
  }

  // Handle comments
  if (observationPayload.comment) {
    observation.note = [
      {
        text: observationPayload.comment,
      },
    ];
  }

  return observation;
};

/**
 * Recursively creates FHIR Observation resources from ObservationDataInFormControls array
 * Creates hierarchical structure with hasMember references for group observations
 * Children are ordered before parents to ensure proper reference resolution
 * @param observations - Array of observation data from form2-controls
 * @param subjectReference - Reference to the patient
 * @param encounterReference - Reference to the encounter
 * @param performerReference - Reference to the practitioner
 * @returns Array of objects containing the observation resource and its generated fullUrl
 */
export const createObservationResources = (
  observations: ObservationDataInFormControls[],
  subjectReference: Reference,
  encounterReference: Reference,
  performerReference: Reference,
): Array<{ resource: Observation; fullUrl: string }> => {
  const results: Array<{ resource: Observation; fullUrl: string }> = [];

  for (const obs of observations) {
    // Process group members if present - create hierarchical structure with hasMember
    if (obs.groupMembers && obs.groupMembers.length > 0) {
      // Recursively create observations for group members (children first)
      const memberResults = createObservationResources(
        obs.groupMembers,
        subjectReference,
        encounterReference,
        performerReference,
      );

      // Add child observations to results first
      results.push(...memberResults);

      // Create parent observation
      const parentObservation = createObservationResource(
        obs,
        subjectReference,
        encounterReference,
        performerReference,
      );

      // Add hasMember references to child observations with type
      parentObservation.hasMember = memberResults.map((member) => ({
        reference: member.fullUrl,
        type: 'Observation',
      }));

      // Add dataAbsentReason for parent observations without values
      // This indicates the observation is a grouping/panel and has no value itself

      // Generate a unique UUID for parent observation
      const parentUuid = crypto.randomUUID();
      const parentFullUrl = `urn:uuid:${parentUuid}`;

      // Set the id field to match the UUID (required by Bahmni backend)
      const parentObservationWithId: Observation = {
        ...parentObservation,
        id: parentUuid,
      };

      // Add parent observation to results (after children)
      results.push({
        resource: parentObservationWithId,
        fullUrl: parentFullUrl,
      });
    } else {
      // Create observation for leaf observations (no children)
      const observation = createObservationResource(
        obs,
        subjectReference,
        encounterReference,
        performerReference,
      );

      // Generate a unique UUID for this observation
      const uuid = crypto.randomUUID();
      const fullUrl = `urn:uuid:${uuid}`;

      // Set the id field to match the UUID (required by Bahmni backend)
      const observationWithId: Observation = {
        ...observation,
        id: uuid,
      };

      results.push({ resource: observationWithId, fullUrl });
    }
  }

  return results;
};
