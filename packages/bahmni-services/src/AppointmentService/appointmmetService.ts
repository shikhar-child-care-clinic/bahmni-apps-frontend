import { post, get } from '../api';
import {
  APPOINTMENTS_SEARCH_URL,
  APPOINTMENTS_URL,
  BAHMNI_SQL_URL,
  UPCOMING_APPOINTMENTS_SQL_QUERY,
  PAST_APPOINTMENTS_SQL_QUERY,
} from './constants';
import { Appointment } from './models';

export const searchAppointmentsByAttribute = async (
  searchTerm: Record<string, string>,
): Promise<Appointment[]> => {
  const appointments = await post<Appointment[]>(
    APPOINTMENTS_SEARCH_URL,
    searchTerm,
  );
  return appointments;
};

/**
 * Transforms SQL endpoint response to Appointment interface format
 * SQL response has flat keys like DASHBOARD_APPOINTMENTS_*_KEY
 * This is a private helper to convert raw SQL data to domain objects
 */
const transformSqlAppointmentResponse = (
  sqlResponse: Record<string, unknown>,
): Appointment & {
  appointmentSlot?: string;
  reason?: string;
} => {
  return {
    uuid: sqlResponse.uuid as string,
    startDateTime:
      sqlResponse.DASHBOARD_APPOINTMENTS_START_DATE_IN_UTC_KEY as number,
    endDateTime:
      sqlResponse.DASHBOARD_APPOINTMENTS_END_DATE_IN_UTC_KEY as number,
    appointmentNumber:
      (sqlResponse.DASHBOARD_APPOINTMENTS_APPOINTMENT_NUMBER_KEY as
        | string
        | undefined) ?? '-',
    appointmentSlot:
      (sqlResponse.DASHBOARD_APPOINTMENTS_SLOT_KEY as string | undefined) ??
      '-',
    reason:
      (sqlResponse.DASHBOARD_APPOINTMENTS_REASON_KEY as string | undefined) ??
      '-',
    dateCreated: 0,
    dateAppointmentScheduled: 0,
    appointmentKind: '',
    service: {
      appointmentServiceId: 0,
      name:
        (sqlResponse.DASHBOARD_APPOINTMENTS_SERVICE_KEY as
          | string
          | undefined) ?? '-',
      description: null,
      speciality: null,
      startTime: '',
      endTime: '',
      location: {
        name:
          (sqlResponse.DASHBOARD_APPOINTMENTS_LOCATION_KEY as
            | string
            | undefined) ?? '-',
        uuid: '',
      },
      uuid: '',
      color: '',
      initialAppointmentStatus: null,
    },
    serviceType: {
      id: undefined,
      name:
        (sqlResponse.DASHBOARD_APPOINTMENTS_SERVICE_TYPE_KEY as
          | string
          | undefined) ?? '-',
      description: undefined,
      uuid: '',
    },
    provider: {
      id: undefined,
      name:
        (sqlResponse.DASHBOARD_APPOINTMENTS_PROVIDER_KEY as
          | string
          | undefined) ?? '-',
      uuid: '',
    },
    location: {
      name:
        (sqlResponse.DASHBOARD_APPOINTMENTS_LOCATION_KEY as
          | string
          | undefined) ?? '-',
      uuid: '',
    },
    status:
      (sqlResponse.DASHBOARD_APPOINTMENTS_STATUS_KEY as string | undefined) ??
      'Unknown',
    comments: null,
    reasons: [],
    patient: {
      uuid: '',
      identifier: '',
      name: '',
      gender: '',
      birthDate: 0,
      age: 0,
      PatientIdentifier: '',
      customAttributes: [],
    },
  };
};

/**
 * Fetch upcoming appointments for a patient using SQL Report endpoint
 * Upcoming appointments are those scheduled for today and future dates
 * Returns transformed domain objects (Appointment[])
 */
export const getUpcomingAppointments = async (
  patientUuid: string,
): Promise<
  Array<
    Appointment & {
      appointmentSlot?: string;
      reason?: string;
    }
  >
> => {
  const sqlResults = await get<Record<string, unknown>[]>(
    `${BAHMNI_SQL_URL}?patientUuid=${patientUuid}&q=${UPCOMING_APPOINTMENTS_SQL_QUERY}&v=full`,
  );
  // Transform SQL response to domain objects
  return (sqlResults || []).map(transformSqlAppointmentResponse);
};

/**
 * Fetch past appointments for a patient using SQL Report endpoint
 * Past appointments are those that occurred before today
 * Returns transformed domain objects (Appointment[])
 */
export const getPastAppointments = async (
  patientUuid: string,
): Promise<
  Array<
    Appointment & {
      appointmentSlot?: string;
      reason?: string;
    }
  >
> => {
  const sqlResults = await get<Record<string, unknown>[]>(
    `${BAHMNI_SQL_URL}?patientUuid=${patientUuid}&q=${PAST_APPOINTMENTS_SQL_QUERY}&v=full`,
  );
  // Transform SQL response to domain objects
  return (sqlResults || []).map(transformSqlAppointmentResponse);
};

export const updateAppointmentStatus = async (
  appointmentUuid: string,
  toStatus: string,
  onDate?: Date,
): Promise<Appointment> => {
  const updatedAppointment = await post<Appointment>(
    `${APPOINTMENTS_URL}/${appointmentUuid}/status-change`,
    { toStatus, onDate },
  );
  return updatedAppointment;
};

export async function getAppointmentById(uuid: string): Promise<Appointment> {
  return await get<Appointment>(`${APPOINTMENTS_URL}/${uuid}`);
}
