import { PersonAttributeType, PatientAddress, PatientIdentifier } from '@bahmni/services';
import {
  BasicInfoData,
  PersonAttributesData,
  AdditionalIdentifiersData,
} from '../models/patient';

const PERSON_ATTRIBUTE_EXT_URL =
  'http://fhir.openmrs.org/ext/person/attribute';
const BIRTHDATE_EXT_URL =
  'http://fhir.openmrs.org/ext/patient/birthdate';

// ---------------------------------------------------------------------------
// Lightweight FHIR R4 Patient interface (only the fields used by this app)
// ---------------------------------------------------------------------------

interface FhirCoding {
  system: string;
  code: string;
}

interface FhirExtension {
  url: string;
  valueBoolean?: boolean;
  valueString?: string;
  valueReference?: { reference: string };
  extension?: FhirExtension[];
}

interface FhirIdentifier {
  use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old';
  value?: string;
  type?: { coding: FhirCoding[] };
}

interface FhirHumanName {
  use?: 'official' | 'usual' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
  given?: string[];
  family?: string;
}

interface FhirAddress {
  use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
  line?: string[];
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  [key: string]: unknown;
}

export interface FhirPatientResource {
  resourceType: 'Patient';
  id?: string;
  identifier: FhirIdentifier[];
  name: FhirHumanName[];
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  extension?: FhirExtension[];
  address?: FhirAddress[];
}

// ---------------------------------------------------------------------------
// Input interface
// ---------------------------------------------------------------------------

export interface FhirPatientMapperInput {
  profile: BasicInfoData & {
    dobEstimated: boolean;
    patientIdentifier: PatientIdentifier;
  };
  address: PatientAddress;
  contact: PersonAttributesData;
  additional: PersonAttributesData;
  additionalIdentifiers: AdditionalIdentifiersData;
  personAttributes: PersonAttributeType[];
  /** Supply for update, omit for create */
  patientUuid?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Maps the OpenMRS single-character gender code (M/F/O/U) to the FHIR R4
 * gender code (male/female/other/unknown).
 */
export function mapGenderToFhir(
  gender: string,
): 'male' | 'female' | 'other' | 'unknown' {
  const initial = (gender ?? '').charAt(0).toUpperCase();
  if (initial === 'M') return 'male';
  if (initial === 'F') return 'female';
  if (initial === 'O') return 'other';
  return 'unknown';
}

function buildPersonAttributeExtensions(
  allAttributes: PersonAttributesData,
  attributeMap: Map<string, string>,
): FhirExtension[] {
  const extensions: FhirExtension[] = [];
  Object.entries(allAttributes).forEach(([key, value]) => {
    if (value && attributeMap.has(key)) {
      extensions.push({
        url: PERSON_ATTRIBUTE_EXT_URL,
        extension: [
          { url: 'value', valueString: String(value) },
          {
            url: 'attributeType',
            valueReference: {
              reference: `AttributeType/${attributeMap.get(key)!}`,
            },
          },
        ],
      });
    }
  });
  return extensions;
}

function buildAddressResource(address: PatientAddress): FhirAddress | null {
  if (!address) return null;

  const fhirAddress: FhirAddress = { use: 'home' };
  const lines: string[] = [];

  Object.entries(address).forEach(([key, val]) => {
    if (!val || (typeof val === 'string' && val.trim() === '')) return;
    const strVal = String(val);
    if (key === 'cityVillage') fhirAddress.city = strVal;
    else if (key === 'stateProvince') fhirAddress.state = strVal;
    else if (key === 'postalCode') fhirAddress.postalCode = strVal;
    else if (key === 'country') fhirAddress.country = strVal;
    else if (['address1', 'address2', 'address3'].includes(key))
      lines.push(strVal);
  });

  if (lines.length > 0) fhirAddress.line = lines;
  return fhirAddress;
}

// ---------------------------------------------------------------------------
// Main mapper
// ---------------------------------------------------------------------------

/**
 * Converts registration form data into a FHIR R4 Patient resource.
 *
 * Handles:
 * - Name (given + family)
 * - Identifiers (primary + additional)
 * - Gender (mapped to FHIR codes)
 * - Birthdate + estimated-birthdate extension
 * - Person attributes as FHIR extensions
 * - Address (OpenMRS address fields mapped to FHIR Address)
 *
 * Note: Patient relationships are NOT included in the FHIR Patient resource.
 * They are managed via a separate OpenMRS REST call (BAH-XXXX, pending FHIR
 * relationship migration).
 */
export function buildFhirPatientResource(
  input: FhirPatientMapperInput,
): FhirPatientResource {
  const {
    profile,
    address,
    contact,
    additional,
    additionalIdentifiers,
    personAttributes,
    patientUuid,
  } = input;

  // ── Identifiers ───────────────────────────────────────────────────────────
  const identifiers: FhirIdentifier[] = [];
  const primaryId = profile.patientIdentifier;
  if (primaryId?.identifier) {
    identifiers.push({
      use: 'official',
      value: String(primaryId.identifier),
      type: {
        coding: [
          {
            system: 'http://fhir.openmrs.org',
            code: String(primaryId.identifierType ?? ''),
          },
        ],
      },
    });
  }
  Object.entries(additionalIdentifiers).forEach(([typeUuid, value]) => {
    if (value && value.trim() !== '') {
      identifiers.push({
        value,
        type: {
          coding: [{ system: 'http://fhir.openmrs.org', code: typeUuid }],
        },
      });
    }
  });

  // ── Name ──────────────────────────────────────────────────────────────────
  const given: string[] = [profile.firstName];
  if (profile.middleName?.trim()) given.push(profile.middleName.trim());

  // ── Extensions ────────────────────────────────────────────────────────────
  const extensions: FhirExtension[] = [];

  if (profile.dobEstimated) {
    extensions.push({
      url: BIRTHDATE_EXT_URL,
      extension: [{ url: 'estimated', valueBoolean: true }],
    });
  }

  const attributeMap = new Map<string, string>();
  personAttributes.forEach((attr) => attributeMap.set(attr.name, attr.uuid));

  const allAttributes: PersonAttributesData = { ...contact, ...additional };
  extensions.push(
    ...buildPersonAttributeExtensions(allAttributes, attributeMap),
  );

  // ── Address ───────────────────────────────────────────────────────────────
  const fhirAddresses: FhirAddress[] = [];
  const fhirAddr = buildAddressResource(address);
  if (fhirAddr) fhirAddresses.push(fhirAddr);

  // ── Assemble ──────────────────────────────────────────────────────────────
  const resource: FhirPatientResource = {
    resourceType: 'Patient',
    ...(patientUuid && { id: patientUuid }),
    identifier: identifiers,
    name: [{ use: 'official', given, family: profile.lastName }],
    gender: mapGenderToFhir(profile.gender),
    ...(profile.dateOfBirth && { birthDate: profile.dateOfBirth }),
    ...(extensions.length > 0 && { extension: extensions }),
    ...(fhirAddresses.length > 0 && { address: fhirAddresses }),
  };

  return resource;
}
