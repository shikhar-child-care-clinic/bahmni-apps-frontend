import { ObservationDataInFormControls } from '@bahmni/services';
import { Observation, Reference } from 'fhir/r4';
import { createCodeableConcept, createCoding } from './codeableConceptCreator';

const INTERPRETATION_TO_CODE: Record<
  string,
  { code: string; display: string }
> = {
  ABNORMAL: { code: 'A', display: 'Abnormal' },
  NORMAL: { code: 'N', display: 'Normal' },
};

const handleStringValue = (
  value: string,
  observation: Observation,
): Observation | null => {
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
    observation.valueQuantity = { value: numericValue };
  } else if (trimmedValue !== '') {
    observation.valueString = value;
  }

  return null;
};

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

  if (value !== null && value !== undefined) {
    switch (typeof value) {
      case 'number':
        observation.valueQuantity = { value };
        break;
      case 'string': {
        const result = handleStringValue(value, observation);
        if (result) return result;
        break;
      }
      case 'boolean':
        observation.valueBoolean = value;
        break;
      case 'object':
        if (value instanceof Date) {
          observation.valueDateTime = value.toISOString();
        } else if ('uuid' in value) {
          observation.valueCodeableConcept = createCodeableConcept([
            createCoding(value.uuid, undefined, value.display),
          ]);
        }
        break;
    }
  }

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

  if (observationPayload.formNamespace && observationPayload.formFieldPath) {
    observation.extension = [
      {
        url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
        valueString: `${observationPayload.formNamespace}^${observationPayload.formFieldPath}`,
      },
    ];
  }

  if (observationPayload.comment) {
    observation.note = [
      {
        text: observationPayload.comment,
      },
    ];
  }

  return observation;
};

export const createObservationResources = (
  observations: ObservationDataInFormControls[],
  subjectReference: Reference,
  encounterReference: Reference,
  performerReference: Reference,
): Array<{ resource: Observation; fullUrl: string }> => {
  const results: Array<{ resource: Observation; fullUrl: string }> = [];

  for (const obs of observations) {
    if (obs.groupMembers && obs.groupMembers.length > 0) {
      const memberResults = createObservationResources(
        obs.groupMembers,
        subjectReference,
        encounterReference,
        performerReference,
      );

      results.push(...memberResults);

      const parentObservation = createObservationResource(
        obs,
        subjectReference,
        encounterReference,
        performerReference,
      );

      parentObservation.hasMember = memberResults.map((member) => ({
        reference: member.fullUrl,
        type: 'Observation',
      }));

      parentObservation.valueString = obs.groupMembers
        .map((member) => {
          const value = member.value;
          if (value === null || value === undefined) return '';
          if (typeof value === 'object' && 'display' in value)
            return value.display;
          return String(value);
        })
        .filter(Boolean)
        .join(', ');

      const parentUuid = crypto.randomUUID();
      const parentFullUrl = `urn:uuid:${parentUuid}`;

      const parentObservationWithId: Observation = {
        ...parentObservation,
        id: parentUuid,
      };

      results.push({
        resource: parentObservationWithId,
        fullUrl: parentFullUrl,
      });
    } else {
      const observation = createObservationResource(
        obs,
        subjectReference,
        encounterReference,
        performerReference,
      );

      const uuid = crypto.randomUUID();
      const fullUrl = `urn:uuid:${uuid}`;

      const observationWithId: Observation = {
        ...observation,
        id: uuid,
      };

      results.push({ resource: observationWithId, fullUrl });
    }
  }

  return results;
};
