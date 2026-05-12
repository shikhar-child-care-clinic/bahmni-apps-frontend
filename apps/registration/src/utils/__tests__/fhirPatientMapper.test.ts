import {
  buildFhirPatientResource,
  mapGenderToFhir,
  type FhirPatientResource,
} from '../fhirPatientMapper';
import type { PersonAttributeType } from '@bahmni/services';

const mockPersonAttributes: PersonAttributeType[] = [
  { uuid: 'phone-uuid', name: 'phoneNumber', format: 'java.lang.String', concept: null },
  { uuid: 'email-uuid', name: 'email', format: 'java.lang.String', concept: null },
];

const baseProfile = {
  firstName: 'John',
  middleName: 'Michael',
  lastName: 'Doe',
  gender: 'M',
  dateOfBirth: '1990-05-15',
  dobEstimated: false,
  patientIdentifier: {
    identifier: 'GAN200001',
    identifierType: 'primary-type-uuid',
    preferred: true,
  },
};

const baseAddress = {
  address1: '123 Main St',
  address2: 'Apt 4',
  cityVillage: 'Springfield',
  stateProvince: 'IL',
  postalCode: '62701',
  country: 'USA',
};

const emptyContact = {};
const emptyAdditional = {};
const emptyAdditionalIdentifiers = {};

describe('mapGenderToFhir', () => {
  it('maps "M" to "male"', () => {
    expect(mapGenderToFhir('M')).toBe('male');
  });

  it('maps "F" to "female"', () => {
    expect(mapGenderToFhir('F')).toBe('female');
  });

  it('maps "O" to "other"', () => {
    expect(mapGenderToFhir('O')).toBe('other');
  });

  it('maps unknown value to "unknown"', () => {
    expect(mapGenderToFhir('')).toBe('unknown');
    expect(mapGenderToFhir('X')).toBe('unknown');
  });

  it('is case-insensitive', () => {
    expect(mapGenderToFhir('m')).toBe('male');
    expect(mapGenderToFhir('f')).toBe('female');
  });
});

describe('buildFhirPatientResource', () => {
  it('sets resourceType to "Patient"', () => {
    const result = buildFhirPatientResource({
      profile: baseProfile,
      address: baseAddress,
      contact: emptyContact,
      additional: emptyAdditional,
      additionalIdentifiers: emptyAdditionalIdentifiers,
      personAttributes: [],
    });
    expect(result.resourceType).toBe('Patient');
  });

  it('does not set id for create (no patientUuid)', () => {
    const result = buildFhirPatientResource({
      profile: baseProfile,
      address: baseAddress,
      contact: emptyContact,
      additional: emptyAdditional,
      additionalIdentifiers: emptyAdditionalIdentifiers,
      personAttributes: [],
    });
    expect(result.id).toBeUndefined();
  });

  it('sets id for update (patientUuid provided)', () => {
    const result = buildFhirPatientResource({
      profile: baseProfile,
      address: baseAddress,
      contact: emptyContact,
      additional: emptyAdditional,
      additionalIdentifiers: emptyAdditionalIdentifiers,
      personAttributes: [],
      patientUuid: 'patient-uuid-123',
    });
    expect(result.id).toBe('patient-uuid-123');
  });

  it('maps gender correctly', () => {
    const result = buildFhirPatientResource({
      profile: baseProfile,
      address: baseAddress,
      contact: emptyContact,
      additional: emptyAdditional,
      additionalIdentifiers: emptyAdditionalIdentifiers,
      personAttributes: [],
    });
    expect(result.gender).toBe('male');
  });

  it('includes birthDate when provided', () => {
    const result = buildFhirPatientResource({
      profile: baseProfile,
      address: baseAddress,
      contact: emptyContact,
      additional: emptyAdditional,
      additionalIdentifiers: emptyAdditionalIdentifiers,
      personAttributes: [],
    });
    expect(result.birthDate).toBe('1990-05-15');
  });

  it('maps name with given and family', () => {
    const result = buildFhirPatientResource({
      profile: baseProfile,
      address: baseAddress,
      contact: emptyContact,
      additional: emptyAdditional,
      additionalIdentifiers: emptyAdditionalIdentifiers,
      personAttributes: [],
    });
    expect(result.name).toHaveLength(1);
    expect(result.name[0].use).toBe('official');
    expect(result.name[0].given).toContain('John');
    expect(result.name[0].given).toContain('Michael');
    expect(result.name[0].family).toBe('Doe');
  });

  it('omits empty middleName from given', () => {
    const profileNoMiddle = { ...baseProfile, middleName: '' };
    const result = buildFhirPatientResource({
      profile: profileNoMiddle,
      address: baseAddress,
      contact: emptyContact,
      additional: emptyAdditional,
      additionalIdentifiers: emptyAdditionalIdentifiers,
      personAttributes: [],
    });
    expect(result.name[0].given).toEqual(['John']);
  });

  it('builds primary identifier with official use', () => {
    const result = buildFhirPatientResource({
      profile: baseProfile,
      address: baseAddress,
      contact: emptyContact,
      additional: emptyAdditional,
      additionalIdentifiers: emptyAdditionalIdentifiers,
      personAttributes: [],
    });
    const primary = result.identifier.find((id) => id.use === 'official');
    expect(primary).toBeDefined();
    expect(primary!.value).toBe('GAN200001');
    expect(primary!.type!.coding[0].code).toBe('primary-type-uuid');
  });

  it('includes additional identifiers', () => {
    const result = buildFhirPatientResource({
      profile: baseProfile,
      address: baseAddress,
      contact: emptyContact,
      additional: emptyAdditional,
      additionalIdentifiers: { 'extra-type-uuid': 'EXT001' },
      personAttributes: [],
    });
    const extra = result.identifier.find(
      (id) => id.type?.coding[0].code === 'extra-type-uuid',
    );
    expect(extra).toBeDefined();
    expect(extra!.value).toBe('EXT001');
  });

  it('skips additional identifiers with empty value', () => {
    const result = buildFhirPatientResource({
      profile: baseProfile,
      address: baseAddress,
      contact: emptyContact,
      additional: emptyAdditional,
      additionalIdentifiers: { 'extra-type-uuid': '  ' },
      personAttributes: [],
    });
    expect(result.identifier).toHaveLength(1);
  });

  it('adds birthdate-estimated extension when dobEstimated is true', () => {
    const result = buildFhirPatientResource({
      profile: { ...baseProfile, dobEstimated: true },
      address: baseAddress,
      contact: emptyContact,
      additional: emptyAdditional,
      additionalIdentifiers: emptyAdditionalIdentifiers,
      personAttributes: [],
    });
    const birthdateExt = (result.extension ?? []).find(
      (e) => e.url === 'http://fhir.openmrs.org/ext/patient/birthdate',
    );
    expect(birthdateExt).toBeDefined();
    const estimatedExt = birthdateExt!.extension?.find(
      (e) => e.url === 'estimated',
    );
    expect(estimatedExt?.valueBoolean).toBe(true);
  });

  it('does not add birthdate extension when dobEstimated is false', () => {
    const result = buildFhirPatientResource({
      profile: { ...baseProfile, dobEstimated: false },
      address: baseAddress,
      contact: emptyContact,
      additional: emptyAdditional,
      additionalIdentifiers: emptyAdditionalIdentifiers,
      personAttributes: [],
    });
    const birthdateExt = (result.extension ?? []).find(
      (e) => e.url === 'http://fhir.openmrs.org/ext/patient/birthdate',
    );
    expect(birthdateExt).toBeUndefined();
  });

  it('maps person attributes as FHIR extensions', () => {
    const result = buildFhirPatientResource({
      profile: baseProfile,
      address: baseAddress,
      contact: { phoneNumber: '0712345678' },
      additional: emptyAdditional,
      additionalIdentifiers: emptyAdditionalIdentifiers,
      personAttributes: mockPersonAttributes,
    });
    const attrExt = (result.extension ?? []).find(
      (e) => e.url === 'http://fhir.openmrs.org/ext/person/attribute',
    );
    expect(attrExt).toBeDefined();
    const valueExt = attrExt!.extension?.find((e) => e.url === 'value');
    const typeExt = attrExt!.extension?.find((e) => e.url === 'attributeType');
    expect(valueExt?.valueString).toBe('0712345678');
    expect(typeExt?.valueReference?.reference).toBe(
      'AttributeType/phone-uuid',
    );
  });

  it('maps address fields to FHIR address', () => {
    const result = buildFhirPatientResource({
      profile: baseProfile,
      address: baseAddress,
      contact: emptyContact,
      additional: emptyAdditional,
      additionalIdentifiers: emptyAdditionalIdentifiers,
      personAttributes: [],
    });
    expect(result.address).toHaveLength(1);
    const addr = result.address![0];
    expect(addr.use).toBe('home');
    expect(addr.city).toBe('Springfield');
    expect(addr.state).toBe('IL');
    expect(addr.postalCode).toBe('62701');
    expect(addr.country).toBe('USA');
    expect(addr.line).toContain('123 Main St');
    expect(addr.line).toContain('Apt 4');
  });

  it('skips empty address fields', () => {
    const sparseAddress = { cityVillage: 'Village', address1: '', stateProvince: '' };
    const result = buildFhirPatientResource({
      profile: baseProfile,
      address: sparseAddress,
      contact: emptyContact,
      additional: emptyAdditional,
      additionalIdentifiers: emptyAdditionalIdentifiers,
      personAttributes: [],
    });
    const addr = result.address![0];
    expect(addr.city).toBe('Village');
    expect(addr.state).toBeUndefined();
    expect(addr.line).toBeUndefined();
  });
});
