import { Appointment } from '@bahmni/services';
import { format, parseISO } from 'date-fns';

export interface FormattedAppointment extends Appointment {
  id?: string; // For table row keying (SortableDataTable uses 'id' for unique keys)
  appointmentDate: string;
  appointmentTime: string;
  appointmentSlot?: string; // Time range (e.g., "11:30 PM - 11:46 PM")
  reason?: string;
  appointmentNumber?: string;
}

/**
 * Format ISO 8601 instant string to UTC date
 * FHIR instant format: "2024-02-05T14:30:00+05:30"
 * Displays date in UTC timezone, not local timezone
 */
const formatDateFromIsoString = (isoDateString: string): string => {
  try {
    if (!isoDateString) return '-';
    const date = parseISO(isoDateString);
    return format(date, 'dd/MM/yyyy', { timeZone: 'UTC' });
  } catch {
    return '-';
  }
};

/**
 * Format ISO 8601 instant string to UTC time
 * FHIR instant format: "2024-02-05T14:30:00+05:30"
 * Displays time in UTC timezone, not local timezone
 */
const formatTimeFromIsoString = (isoDateString: string): string => {
  try {
    if (!isoDateString) return '-';
    const date = parseISO(isoDateString);
    return format(date, 'hh:mm a', { timeZone: 'UTC' });
  } catch {
    return '-';
  }
};

/**
 * Formats an appointment object for display by converting FHIR instant timestamps to readable date and time strings
 * FHIR instant format includes timezone information which parseISO handles automatically
 */
export const formatAppointment = (
  appointment: Appointment & {
    appointmentSlot?: string;
    appointmentNumber?: string;
    reason?: string;
  },
): FormattedAppointment => {
  let appointmentDate = '-';
  let appointmentTime = '-';

  try {
    if (appointment.startDateTime) {
      appointmentDate = formatDateFromIsoString(appointment.startDateTime);
      const startTime = formatTimeFromIsoString(appointment.startDateTime);

      let endTime = startTime;
      if (appointment.endDateTime) {
        endTime = formatTimeFromIsoString(appointment.endDateTime);
      }

      appointmentTime = `${startTime} - ${endTime}`;
    }
  } catch {
    // Fallback in case of any unexpected error
    appointmentDate = '-';
    appointmentTime = '-';
  }

  return {
    ...appointment,
    id: appointment.uuid,
    appointmentDate,
    appointmentTime,
    reason: appointment.reasons?.[0]?.name ?? appointment.comments ?? null,
  };
};

/**
 * Sorts appointments by date in ascending order (earliest first)
 */
export const sortAppointmentsByDate = (
  appointments: FormattedAppointment[],
): FormattedAppointment[] => {
  return [...appointments].sort((a, b) => {
    // Parse date strings in dd/MM/yyyy format and compare
    const dateA = new Date(a.appointmentDate.split('/').reverse().join('-'));
    const dateB = new Date(b.appointmentDate.split('/').reverse().join('-'));
    return dateA.getTime() - dateB.getTime();
  });
};
