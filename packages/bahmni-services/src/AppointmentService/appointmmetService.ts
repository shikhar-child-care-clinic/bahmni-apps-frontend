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
 * Fetch upcoming appointments for a patient using SQL Report endpoint
 * Upcoming appointments are those scheduled for today and future dates
 */
export const getUpcomingAppointments = async (
  patientUuid: string,
): Promise<Appointment[]> => {
  const appointments = await get<Appointment[]>(
    `${BAHMNI_SQL_URL}?patientUuid=${patientUuid}&q=${UPCOMING_APPOINTMENTS_SQL_QUERY}&v=full`,
  );
  return appointments;
};

/**
 * Fetch past appointments for a patient using SQL Report endpoint
 * Past appointments are those that occurred before today
 */
export const getPastAppointments = async (
  patientUuid: string,
): Promise<Appointment[]> => {
  const appointments = await get<Appointment[]>(
    `${BAHMNI_SQL_URL}?patientUuid=${patientUuid}&q=${PAST_APPOINTMENTS_SQL_QUERY}&v=full`,
  );
  return appointments;
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
