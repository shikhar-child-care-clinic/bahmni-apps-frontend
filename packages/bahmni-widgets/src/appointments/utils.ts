import { Appointment } from '@bahmni/services';

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
      sqlResponse.DASHBOARD_APPOINTMENTS_START_DATE_IN_UTC_KEY as unknown as
        | number
        | string
        | number[],
    appointmentSlot: sqlResponse.DASHBOARD_APPOINTMENTS_SLOT_KEY as
      | string
      | undefined,
    appointmentNumber:
      (sqlResponse.DASHBOARD_APPOINTMENTS_APPOINTMENT_NUMBER_KEY as
        | string
        | undefined) ?? undefined,
    reason:
      (sqlResponse.DASHBOARD_APPOINTMENTS_REASON_KEY as string | undefined) ??
      undefined,
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
    endDateTime: 0,
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
 * Formats an appointment object for display by converting timestamps to readable date and time strings
 */
export const formatAppointment = (
  appointment: Appointment & {
    appointmentSlot?: string;
    appointmentNumber?: string;
    reason?: string;
  },
): FormattedAppointment => {
  let appointmentDate = '';
  let appointmentTime = '';

  try {
    // Handle null/undefined startDateTime
    if (!appointment.startDateTime) {
      appointmentDate = '-';
      appointmentTime = '-';
    } else {
      let dateObj: Date | null = null;

      // Check if startDateTime is an array (from SQL endpoint: [year, month, day, hour, minute])
      if (
        Array.isArray(appointment.startDateTime) &&
        appointment.startDateTime.length >= 5
      ) {
        const [year, month, day, hour, minute] = appointment.startDateTime;
        dateObj = new Date(year, month - 1, day, hour, minute);
      } else {
        // Try converting as timestamp or date string
        dateObj = new Date(appointment.startDateTime);
      }

      // Check if date is valid
      if (dateObj && !isNaN(dateObj.getTime())) {
        // Format date as DD/MM/YYYY to match SQL response format
        appointmentDate = dateObj.toLocaleDateString('en-GB');

        // Use appointmentSlot from SQL response if available (time range like "11:30 PM - 11:46 PM")
        // Otherwise format time as HH:MM AM/PM
        appointmentTime =
          appointment.appointmentSlot ??
          dateObj.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
      } else {
        appointmentDate = '-';
        appointmentTime = '-';
      }
    }
  } catch {
    // Fallback in case of any unexpected error
    appointmentDate = '-';
    appointmentTime = '-';
  }

  return {
    ...appointment,
    id: appointment.uuid, // uuid is guaranteed to be unique (generated if not from API)
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
  return [...appointments].sort(
    (a, b) =>
      new Date(a.appointmentDate).getTime() -
      new Date(b.appointmentDate).getTime(),
  );
};
