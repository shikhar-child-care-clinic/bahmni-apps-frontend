import { Appointment } from '@bahmni/services';
import { format } from 'date-fns';

export interface FormattedAppointment extends Appointment {
  id?: string; // For table row keying (SortableDataTable uses 'id' for unique keys)
  appointmentDate: string;
  appointmentTime: string;
  appointmentSlot?: string; // Time range from SQL (e.g., "11:30 PM - 11:46 PM")
}

/**
 * Transforms SQL endpoint response to Appointment interface format
 * SQL response has flat keys like DASHBOARD_APPOINTMENTS_*_KEY
 */
export const transformSqlAppointmentResponse = (
  sqlResponse: Record<string, unknown>,
): Appointment & {
  appointmentSlot?: string;
  appointmentNumber?: string;
  reason?: string;
} => {
  return {
    uuid: sqlResponse.uuid as string,
    startDateTime:
      sqlResponse.DASHBOARD_APPOINTMENTS_START_DATE_IN_UTC_KEY as number,
    endDateTime:
      sqlResponse.DASHBOARD_APPOINTMENTS_END_DATE_IN_UTC_KEY as number,
    appointmentSlot: sqlResponse.DASHBOARD_APPOINTMENTS_SLOT_KEY as
      | string
      | undefined,
    appointmentNumber:
      sqlResponse.DASHBOARD_APPOINTMENTS_APPOINTMENT_NUMBER_KEY as
        | string
        | undefined,
    reason: sqlResponse.DASHBOARD_APPOINTMENTS_REASON_KEY as string | undefined,
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
    appointmentKind: '',
    comments: null,
    reasons: [],
    dateCreated: 0,
    dateAppointmentScheduled: 0,
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
    // Parse date strings in dd/MM/yyyy format and compare
    const dateA = new Date(a.appointmentDate.split('/').reverse().join('-'));
    const dateB = new Date(b.appointmentDate.split('/').reverse().join('-'));
    return dateA.getTime() - dateB.getTime();
  });
};
