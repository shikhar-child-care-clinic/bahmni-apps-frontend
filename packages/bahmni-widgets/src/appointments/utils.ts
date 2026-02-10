import { Appointment } from '@bahmni/services';
import { format } from 'date-fns';

export interface FormattedAppointment extends Appointment {
  id?: string; // For table row keying (SortableDataTable uses 'id' for unique keys)
  appointmentDate: string;
  appointmentTime: string;
  appointmentSlot?: string; // Time range from SQL (e.g., "11:30 PM - 11:46 PM")
}

/**
 * Converts UTC array [year, month, day, hour, minute] to formatted date string
 * This ensures UTC time is converted to local timezone before formatting
 */
const formatDateFromUtcArray = (dateTimeArray: number[]): string => {
  try {
    if (!Array.isArray(dateTimeArray) || dateTimeArray.length < 5) {
      return '-';
    }

    const [year, month, day, hour, minute] = dateTimeArray;

    // Create date from UTC values using Date.UTC()
    // Date.UTC returns milliseconds since epoch, creating a proper UTC timestamp
    // When we pass it to a Date object, it's automatically converted to local timezone for display
    const utcTimestamp = Date.UTC(year, month - 1, day, hour, minute);
    const date = new Date(utcTimestamp);

    // Format as DD/MM/YYYY in local timezone
    return format(date, 'dd/MM/yyyy');
  } catch {
    return '-';
  }
};

/**
 * Converts UTC array [year, month, day, hour, minute] to formatted time string
 * This ensures UTC time is converted to local timezone before formatting
 */
const formatTimeFromUtcArray = (dateTimeArray: number[]): string => {
  try {
    if (!Array.isArray(dateTimeArray) || dateTimeArray.length < 5) {
      return '-';
    }

    const [year, month, day, hour, minute] = dateTimeArray;

    // Create date from UTC values using Date.UTC()
    // Date.UTC returns milliseconds since epoch, creating a proper UTC timestamp
    // When we pass it to a Date object, it's automatically converted to local timezone for display
    const utcTimestamp = Date.UTC(year, month - 1, day, hour, minute);
    const date = new Date(utcTimestamp);

    // Format as hh:mm a (e.g., "09:30 PM") in local timezone
    return format(date, 'hh:mm a');
  } catch {
    return '-';
  }
};

/**
 * Formats an appointment object for display by converting UTC timestamps to readable date and time strings
 *
 * NOTE: Time slot is reconstructed from UTC arrays (not from response) to ensure proper timezone conversion
 * This function handles display-layer formatting only. Service layer has already transformed SQL data to domain objects.
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
    // Handle null/undefined startDateTime
    if (appointment.startDateTime) {
      // Check if startDateTime is an array (from SQL endpoint: [year, month, day, hour, minute])
      if (Array.isArray(appointment.startDateTime)) {
        appointmentDate = formatDateFromUtcArray(
          appointment.startDateTime as number[],
        );

        // Reconstruct time slot from UTC arrays to ensure proper timezone conversion
        const startTime = formatTimeFromUtcArray(
          appointment.startDateTime as number[],
        );

        // Check if endDateTime is also available in UTC format
        let endTime = startTime; // Default to start time if no end time
        if (appointment.endDateTime && Array.isArray(appointment.endDateTime)) {
          endTime = formatTimeFromUtcArray(appointment.endDateTime as number[]);
        }

        // Reconstruct time slot from converted times (don't use response slot as it's not timezone-converted)
        appointmentTime = `${startTime} - ${endTime}`;
      }
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
  };
};

/**
 * Sorts appointments by date in ascending order (earliest first)
 */
export const sortAppointmentsByDate = (
  appointments: FormattedAppointment[],
): FormattedAppointment[] => {
  return [...appointments].sort((a, b) => {
    // Handle invalid date strings (e.g., "-")
    if (a.appointmentDate === '-' || b.appointmentDate === '-') {
      if (a.appointmentDate === b.appointmentDate) return 0;
      return a.appointmentDate === '-' ? 1 : -1;
    }

    // Parse date strings in dd/MM/yyyy format and compare
    const dateA = new Date(a.appointmentDate.split('/').reverse().join('-'));
    const dateB = new Date(b.appointmentDate.split('/').reverse().join('-'));

    const timeA = dateA.getTime();
    const timeB = dateB.getTime();

    // Handle NaN dates
    if (isNaN(timeA) || isNaN(timeB)) return 0;

    return timeA - timeB;
  });
};
