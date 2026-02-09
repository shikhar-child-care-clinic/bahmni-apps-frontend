import { OPENMRS_FHIR_R4 } from '../constants/app';

/**
 * Helper function to format date to FHIR format (YYYY-MM-DD)
 */
const formatDateToFhir = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get today's date in FHIR format
 */
const getTodayInFhir = (): string => {
  return formatDateToFhir(new Date());
};

/**
 * Get yesterday's date in FHIR format
 * Used for past appointments query since API treats lt and le the same way
 */
const getYesterdayInFhir = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDateToFhir(yesterday);
};

// FHIR Appointment endpoints
export const APPOINTMENT_RESOURCE_URL = (patientUUID: string) =>
  `${OPENMRS_FHIR_R4}/Appointment?patient=${patientUUID}`;

/**
 * Get upcoming appointments URL with date range from today onwards
 * Uses FHIR search parameter: date=ge<today> (greater than or equal today)
 * Sorted by date in ascending order (earliest appointments first)
 */
export const UPCOMING_APPOINTMENTS_URL = (patientUUID: string) => {
  const today = getTodayInFhir();
  return `${OPENMRS_FHIR_R4}/Appointment?patient=${patientUUID}&date=ge${today}&_sort=date`;
};

/**
 * Get past appointments URL with date range before today
 * Uses yesterday's date with lt parameter since API treats lt and le the same way
 * Supports sorting by date (descending to show most recent first)
 * and limiting results with _count parameter
 */
export const PAST_APPOINTMENTS_URL = (
  patientUUID: string,
  sortOrder: string = '-date',
  count?: number,
) => {
  const yesterday = getYesterdayInFhir();
  let url = `${OPENMRS_FHIR_R4}/Appointment?patient=${patientUUID}&date=lt${yesterday}&_sort=${sortOrder}`;
  if (count !== undefined && count > 0) {
    url += `&_count=${count}`;
  }
  return url;
};

export const APPOINTMENT_BY_ID_URL = (uuid: string) =>
  `${OPENMRS_FHIR_R4}/Appointment/${uuid}`;
