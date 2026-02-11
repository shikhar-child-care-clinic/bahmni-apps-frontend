import { OPENMRS_REST_V1 } from '../constants/app';

export const APPOINTMENTS_SEARCH_URL = OPENMRS_REST_V1 + '/appointments/search';
export const APPOINTMENTS_URL = OPENMRS_REST_V1 + '/appointments';
export const BAHMNI_SQL_URL = OPENMRS_REST_V1 + '/bahmnicore/sql';

export const UPCOMING_APPOINTMENTS_SQL_QUERY =
  'bahmni.sqlGet.upComingAppointments';
export const PAST_APPOINTMENTS_SQL_QUERY = 'bahmni.sqlGet.pastAppointments';
