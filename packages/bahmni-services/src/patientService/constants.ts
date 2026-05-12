import {
  OPENMRS_REST_V1,
  OPENMRS_REST_V2,
  OPENMRS_FHIR_R4,
} from '../constants/app';

export const CREATE_PATIENT_URL =
  OPENMRS_REST_V1 + '/bahmnicore/patientprofile';
export const UPDATE_PATIENT_URL = (patientUuid: string) =>
  OPENMRS_REST_V1 + `/bahmnicore/patientprofile/${patientUuid}`;
export const PATIENT_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 + `/Patient/${patientUUID}`;

/** FHIR R4 endpoint for creating a new Patient resource */
export const FHIR_CREATE_PATIENT_URL = OPENMRS_FHIR_R4 + '/Patient';

export const SEARCH_PATIENT_URL = (query: string) =>
  OPENMRS_FHIR_R4 + `/Patient?_content=${query}&_summary=data`;
export const SEARCH_PATIENT_BY_ATTRIBUTE_URL = (
  attribute: string,
  query: string,
) =>
  OPENMRS_FHIR_R4 +
  `/Patient?custom:include=Patient:identifier&_content=${query}&custom:searchParam=${attribute}`;
export const IDENTIFIER_TYPES_URL =
  OPENMRS_REST_V1 + '/patientidentifiertype?v=custom:(uuid,name,required,format,uniquenessConstraint,description)';
export const GET_IDENTIFIER_DATA_URL = (identifierTypeName: string) =>
  OPENMRS_REST_V1 +
  `/idgen/nextIdentifier?source=1&identifierTypeName=${identifierTypeName}`;
export const GENDERS_URL = OPENMRS_REST_V1 + '/concepts?conceptClass=Gender';
export const ADDRESS_HIERARCHY_ENTRIES_URL = (searchString: string, fieldName: string, limit: number) =>
  OPENMRS_REST_V1 +
  `/addresshierarchy/address/search?searchString=${searchString}&addressField=${fieldName}&limit=${limit}`;
export const ORDERED_ADDRESS_HIERARCHY_LEVELS_URL =
  OPENMRS_REST_V1 + '/addresshierarchy/addressHierarchyLevel/orderedAddressHierarchyLevels';
export const PATIENT_IMAGE_URL = (patientUuid: string) =>
  OPENMRS_REST_V2 + `/patientImage?patientUuid=${patientUuid}`;
export const GET_PATIENT_PROFILE_URL = (patientUuid: string) =>
  OPENMRS_REST_V1 + `/bahmnicore/bahmnipatientprofile?patientUuid=${patientUuid}&v=full`;
export const RELATIONSHIP_TYPES_URL =
  OPENMRS_REST_V1 + '/relationshiptype?v=custom:(uuid,aIsToB,bIsToA)';
export const PERSON_ATTRIBUTE_TYPES_URL =
  OPENMRS_REST_V1 + '/personattributetype?v=custom:(uuid,name,format,concept:(uuid,setMembers:(uuid,display)))';

export const MAX_PATIENT_AGE_YEARS = 120;
export const MAX_NAME_LENGTH = 50;
export const MAX_PHONE_NUMBER_LENGTH = 10;
