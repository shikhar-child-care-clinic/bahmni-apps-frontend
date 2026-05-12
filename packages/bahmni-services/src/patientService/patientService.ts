import { Patient } from 'fhir/r4';
import { get, post, put } from '../api';
import {
  CREATE_PATIENT_URL,
  UPDATE_PATIENT_URL,
  PATIENT_RESOURCE_URL,
  FHIR_CREATE_PATIENT_URL,
  SEARCH_PATIENT_URL,
  SEARCH_PATIENT_BY_ATTRIBUTE_URL,
  IDENTIFIER_TYPES_URL,
  GET_IDENTIFIER_DATA_URL,
  GENDERS_URL,
  ADDRESS_HIERARCHY_ENTRIES_URL,
  ORDERED_ADDRESS_HIERARCHY_LEVELS_URL,
  PATIENT_IMAGE_URL,
  GET_PATIENT_PROFILE_URL,
  RELATIONSHIP_TYPES_URL,
  PERSON_ATTRIBUTE_TYPES_URL,
} from './constants';
import {
  CreatePatientRequest,
  CreatePatientResponse,
  FormattedPatientData,
  PatientSearchResultBundle,
  IdentifierTypesResponse,
  OrderedAddressHierarchyLevels,
  AddressHierarchyEntry,
  PatientProfileResponse,
  PersonAttributeTypesResponse,
} from './models';

export const createPatient = (
  patientData: CreatePatientRequest,
): Promise<CreatePatientResponse> =>
  post<CreatePatientResponse>(CREATE_PATIENT_URL, patientData);

export const updatePatient = (
  patientUuid: string,
  patientData: CreatePatientRequest,
): Promise<CreatePatientResponse> =>
  post<CreatePatientResponse>(UPDATE_PATIENT_URL(patientUuid), patientData);

/**
 * Create a new patient using the FHIR R4 Patient resource.
 * POST /openmrs/ws/fhir2/R4/Patient
 */
export const createFhirPatient = <T = Record<string, unknown>>(
  patientResource: T,
): Promise<T> => post<T>(FHIR_CREATE_PATIENT_URL, patientResource);

/**
 * Update an existing patient using the FHIR R4 Patient resource.
 * PUT /openmrs/ws/fhir2/R4/Patient/{uuid}
 */
export const updateFhirPatient = <T = Record<string, unknown>>(
  patientUuid: string,
  patientResource: T,
): Promise<T> => put<T>(PATIENT_RESOURCE_URL(patientUuid), patientResource);

/**
 * Upload or update a patient's photo.
 * POST /openmrs/ws/rest/v2/patientImage?patientUuid={uuid}
 */
export const uploadPatientPhoto = (
  patientUuid: string,
  base64Image: string,
): Promise<void> => post<void>(PATIENT_IMAGE_URL(patientUuid), { image: base64Image });

export const getPatientById = (patientUuid: string): Promise<Patient> =>
  get<Patient>(PATIENT_RESOURCE_URL(patientUuid));

export const getFormattedPatientById = (
  patientUuid: string,
): Promise<FormattedPatientData> =>
  get<FormattedPatientData>(`${PATIENT_RESOURCE_URL(patientUuid)}?v=full`);

export const searchPatientByNameOrId = (
  query: string,
): Promise<PatientSearchResultBundle> =>
  get<PatientSearchResultBundle>(SEARCH_PATIENT_URL(query));

export const searchPatientByCustomAttribute = (
  attribute: string,
  query: string,
): Promise<PatientSearchResultBundle> =>
  get<PatientSearchResultBundle>(SEARCH_PATIENT_BY_ATTRIBUTE_URL(attribute, query));

export const getIdentifierTypes = (): Promise<IdentifierTypesResponse> =>
  get<IdentifierTypesResponse>(IDENTIFIER_TYPES_URL);

export const getPrimaryIdentifierType = () => getIdentifierTypes();

export const getIdentifierData = (identifierTypeName: string) =>
  get<{ identifiers: string[] }>(GET_IDENTIFIER_DATA_URL(identifierTypeName));

export const getGenders = () =>
  get<{ answers: { uuid: string; display: string }[] }>(GENDERS_URL);

export const getAddressHierarchyEntries = (
  searchString: string,
  fieldName: string,
  limit: number,
): Promise<AddressHierarchyEntry[]> =>
  get<AddressHierarchyEntry[]>(
    ADDRESS_HIERARCHY_ENTRIES_URL(searchString, fieldName, limit),
  );

export const getOrderedAddressHierarchyLevels =
  (): Promise<OrderedAddressHierarchyLevels> =>
    get<OrderedAddressHierarchyLevels>(ORDERED_ADDRESS_HIERARCHY_LEVELS_URL);

export const getPatientImageAsDataUrl = (patientUuid: string): Promise<string> =>
  get<string>(PATIENT_IMAGE_URL(patientUuid));

export const getPatientProfile = (
  patientUuid: string,
): Promise<PatientProfileResponse> =>
  get<PatientProfileResponse>(GET_PATIENT_PROFILE_URL(patientUuid));

export const getRelationshipTypes = () =>
  get<{ results: { uuid: string; aIsToB: string; bIsToA: string }[] }>(
    RELATIONSHIP_TYPES_URL,
  );

export const getPersonAttributeTypes = (): Promise<PersonAttributeTypesResponse> =>
  get<PersonAttributeTypesResponse>(PERSON_ATTRIBUTE_TYPES_URL);
