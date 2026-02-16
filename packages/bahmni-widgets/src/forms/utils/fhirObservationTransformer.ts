import { Bundle, Observation } from 'fhir/r4';
import {
  FHIR_OBSERVATION_COMPLEX_DATA_URL,
  FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL,
} from '@bahmni/services';
import { ObservationData } from '../models';

/**
 * Extract value from FHIR Observation
 * Handles various FHIR value types and complex data extensions
 */
function extractObservationValue(observation: Observation): {
  value: unknown;
  valueAsString: string;
} {
  // Check for complex data (images/videos) in extensions
  const complexDataExt = observation.extension?.find(
    (ext) => ext.url === FHIR_OBSERVATION_COMPLEX_DATA_URL,
  );

  if (complexDataExt?.valueAttachment?.url) {
    const url = complexDataExt.valueAttachment.url;
    const contentType = complexDataExt.valueAttachment.contentType || '';

    // Return the URL for images and videos
    if (contentType.startsWith('image/') || contentType.startsWith('video/')) {
      return {
        value: url,
        valueAsString: url,
      };
    }

    // For other complex types, return the title or URL
    return {
      value: url,
      valueAsString: complexDataExt.valueAttachment.title || url,
    };
  }

  // Handle standard FHIR value types
  if (observation.valueString !== undefined) {
    return {
      value: observation.valueString,
      valueAsString: observation.valueString,
    };
  }

  if (observation.valueInteger !== undefined) {
    return {
      value: observation.valueInteger,
      valueAsString: observation.valueInteger.toString(),
    };
  }

  if (observation.valueBoolean !== undefined) {
    return {
      value: observation.valueBoolean,
      valueAsString: observation.valueBoolean ? 'Yes' : 'No',
    };
  }

  if (observation.valueQuantity) {
    const qty = observation.valueQuantity;
    return {
      value: qty.value,
      valueAsString: qty.value?.toString() ?? '',
    };
  }

  if (observation.valueCodeableConcept) {
    const display =
      observation.valueCodeableConcept.text ||
      observation.valueCodeableConcept.coding?.[0]?.display ||
      '';
    return {
      value: display,
      valueAsString: display,
    };
  }

  if (observation.valueDateTime) {
    return {
      value: observation.valueDateTime,
      valueAsString: observation.valueDateTime,
    };
  }

  // Default empty value
  return {
    value: undefined,
    valueAsString: '',
  };
}

/**
 * Extract concept information from FHIR Observation
 */
function extractConcept(observation: Observation) {
  const code = observation.code;
  const conceptName =
    code?.text || code?.coding?.[0]?.display || 'Unknown Concept';
  const conceptUuid = code?.coding?.[0]?.code || observation.id || '';

  // Extract units from valueQuantity
  const units = observation.valueQuantity?.unit;

  // Extract reference ranges for numeric observations
  let lowNormal: number | undefined;
  let hiNormal: number | undefined;

  if (observation.referenceRange && observation.referenceRange.length > 0) {
    const range = observation.referenceRange[0];
    lowNormal = range.low?.value;
    hiNormal = range.high?.value;
  }

  return {
    name: conceptName,
    uuid: conceptUuid,
    units,
    lowNormal,
    hiNormal,
  };
}

/**
 * Extract formFieldPath from FHIR extensions
 */
function extractFormFieldPath(observation: Observation): string | undefined {
  const formPathExt = observation.extension?.find(
    (ext) => ext.url === FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL,
  );
  return formPathExt?.valueString;
}

/**
 * Extract comment/notes from FHIR Observation
 */
function extractComment(observation: Observation): string | undefined {
  return observation.note?.[0]?.text;
}

/**
 * Extract interpretation (e.g., ABNORMAL, NORMAL)
 */
function extractInterpretation(observation: Observation): string | undefined {
  const interpretation = observation.interpretation?.[0];
  return interpretation?.text || interpretation?.coding?.[0]?.display;
}

/**
 * Extract provider information from FHIR Observation
 */
function extractProviders(observation: Observation): Array<{
  uuid: string;
  name: string;
}> {
  const providers: Array<{ uuid: string; name: string }> = [];

  // Try to extract from performer references
  if (observation.performer && observation.performer.length > 0) {
    observation.performer.forEach((performer) => {
      if (performer.reference && performer.display) {
        const uuid = performer.reference.split('/').pop() || '';
        providers.push({
          uuid,
          name: performer.display,
        });
      }
    });
  }

  return providers;
}

/**
 * Recursively transform FHIR Observation to ObservationData
 * Handles hasMember for group observations
 */
function transformObservationToObservationData(
  observation: Observation,
  allObservations: Map<string, Observation>,
): ObservationData {
  const concept = extractConcept(observation);
  const { value, valueAsString } = extractObservationValue(observation);
  const formFieldPath = extractFormFieldPath(observation);
  const comment = extractComment(observation);
  const interpretation = extractInterpretation(observation);
  const providers = extractProviders(observation);

  // Handle group members (hasMember references)
  let groupMembers: ObservationData[] | undefined;

  if (observation.hasMember && observation.hasMember.length > 0) {
    groupMembers = [];

    for (const memberRef of observation.hasMember) {
      const memberId = memberRef.reference?.split('/').pop();
      if (memberId) {
        const memberObs = allObservations.get(memberId);
        if (memberObs) {
          groupMembers.push(
            transformObservationToObservationData(memberObs, allObservations),
          );
        }
      }
    }

    // Only set groupMembers if we found any
    if (groupMembers.length === 0) {
      groupMembers = undefined;
    }
  }

  return {
    concept,
    value,
    valueAsString,
    conceptNameToDisplay: concept.name,
    formFieldPath,
    comment,
    interpretation,
    providers: providers.length > 0 ? providers : undefined,
    groupMembers,
  };
}

/**
 * Transform FHIR Observation Bundle to ObservationData array
 * Filters by form name using formFieldPath
 *
 * @param bundle - FHIR Bundle containing observations
 * @param formName - Optional form name to filter observations
 * @returns Array of ObservationData
 */
export function transformFHIRObservationsToObservationData(
  bundle: Bundle<Observation>,
  formName?: string,
): ObservationData[] {
  if (!bundle.entry || bundle.entry.length === 0) {
    return [];
  }

  // Extract all observations and create a map for quick lookup
  const observationsMap = new Map<string, Observation>();
  const topLevelObservations: Observation[] = [];

  for (const entry of bundle.entry) {
    const observation = entry.resource;
    if (observation && observation.resourceType === 'Observation') {
      // Store in map for hasMember lookups
      if (observation.id) {
        observationsMap.set(observation.id, observation);
      }

      // Determine if this is a top-level observation (not referenced by hasMember)
      topLevelObservations.push(observation);
    }
  }

  // Filter out observations that are referenced in hasMember
  const memberIds = new Set<string>();
  for (const obs of topLevelObservations) {
    if (obs.hasMember) {
      for (const memberRef of obs.hasMember) {
        const memberId = memberRef.reference?.split('/').pop();
        if (memberId) {
          memberIds.add(memberId);
        }
      }
    }
  }

  // Only process top-level observations (not members of groups)
  const rootObservations = topLevelObservations.filter(
    (obs) => !obs.id || !memberIds.has(obs.id),
  );

  // Transform observations
  const transformedObservations = rootObservations.map((obs) =>
    transformObservationToObservationData(obs, observationsMap),
  );

  // Filter by form name if provided
  if (formName) {
    return transformedObservations.filter(
      (obs) =>
        obs.formFieldPath && obs.formFieldPath.includes(formName),
    );
  }

  return transformedObservations;
}
