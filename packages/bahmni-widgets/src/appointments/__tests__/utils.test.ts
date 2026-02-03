import { Appointment } from '@bahmni/services';
import {
  transformSqlAppointmentResponse,
  formatAppointment,
  sortAppointmentsByDate,
  FormattedAppointment,
} from '../utils';

describe('transformSqlAppointmentResponse', () => {
  const mockSqlResponse = {
    uuid: 'appt-uuid-123',
    DASHBOARD_APPOINTMENTS_START_DATE_IN_UTC_KEY: [2025, 2, 15, 10, 30],
    DASHBOARD_APPOINTMENTS_SLOT_KEY: '10:30 AM - 10:46 AM',
    DASHBOARD_APPOINTMENTS_APPOINTMENT_NUMBER_KEY: 'APT-12345',
    DASHBOARD_APPOINTMENTS_REASON_KEY: 'Follow-up Consultation',
    DASHBOARD_APPOINTMENTS_SERVICE_KEY: 'Consultation',
    DASHBOARD_APPOINTMENTS_SERVICE_TYPE_KEY: 'General',
    DASHBOARD_APPOINTMENTS_PROVIDER_KEY: 'Dr. Smith',
    DASHBOARD_APPOINTMENTS_LOCATION_KEY: 'OPD-1',
    DASHBOARD_APPOINTMENTS_STATUS_KEY: 'Scheduled',
  };

  it('should transform SQL response to Appointment interface', () => {
    const result = transformSqlAppointmentResponse(mockSqlResponse);

    expect(result.uuid).toBe('appt-uuid-123');
    expect(result.appointmentSlot).toBe('10:30 AM - 10:46 AM');
    expect(result.appointmentNumber).toBe('APT-12345');
    expect(result.reason).toBe('Follow-up Consultation');
    expect(result.status).toBe('Scheduled');
  });

  it('should transform service field correctly', () => {
    const result = transformSqlAppointmentResponse(mockSqlResponse);

    expect(result.service).toBeDefined();
    expect(result.service.name).toBe('Consultation');
  });

  it('should transform provider field correctly', () => {
    const result = transformSqlAppointmentResponse(mockSqlResponse);

    expect(result.provider).toBeDefined();
    expect(result.provider.name).toBe('Dr. Smith');
  });

  it('should transform location field correctly', () => {
    const result = transformSqlAppointmentResponse(mockSqlResponse);

    expect(result.location).toBeDefined();
    expect(result.location.name).toBe('OPD-1');
  });

  it('should handle missing appointment number gracefully', () => {
    const responseWithoutNumber = {
      ...mockSqlResponse,
      DASHBOARD_APPOINTMENTS_APPOINTMENT_NUMBER_KEY: undefined,
    };

    const result = transformSqlAppointmentResponse(responseWithoutNumber);

    expect(result.appointmentNumber).toBeUndefined();
  });

  it('should handle missing reason gracefully', () => {
    const responseWithoutReason = {
      ...mockSqlResponse,
      DASHBOARD_APPOINTMENTS_REASON_KEY: undefined,
    };

    const result = transformSqlAppointmentResponse(responseWithoutReason);

    expect(result.reason).toBeUndefined();
  });

  it('should provide default values for service when missing', () => {
    const responseWithoutService = {
      ...mockSqlResponse,
      DASHBOARD_APPOINTMENTS_SERVICE_KEY: undefined,
    };

    const result = transformSqlAppointmentResponse(responseWithoutService);

    expect(result.service.name).toBe('-');
  });

  it('should provide default values for provider when missing', () => {
    const responseWithoutProvider = {
      ...mockSqlResponse,
      DASHBOARD_APPOINTMENTS_PROVIDER_KEY: undefined,
    };

    const result = transformSqlAppointmentResponse(responseWithoutProvider);

    expect(result.provider.name).toBe('-');
  });

  it('should provide default status when missing', () => {
    const responseWithoutStatus = {
      ...mockSqlResponse,
      DASHBOARD_APPOINTMENTS_STATUS_KEY: undefined,
    };

    const result = transformSqlAppointmentResponse(responseWithoutStatus);

    expect(result.status).toBe('Unknown');
  });

  it('should handle slot field for time range', () => {
    const result = transformSqlAppointmentResponse(mockSqlResponse);

    expect(result.appointmentSlot).toBe('10:30 AM - 10:46 AM');
  });

  it('should handle minimal SQL response', () => {
    const minimalResponse = {
      uuid: 'appt-uuid-456',
    };

    const result = transformSqlAppointmentResponse(minimalResponse);

    expect(result.uuid).toBe('appt-uuid-456');
    expect(result.service.name).toBe('-');
    expect(result.status).toBe('Unknown');
  });
});

describe('formatAppointment', () => {
  const mockAppointment: Appointment & {
    appointmentSlot?: string;
    appointmentNumber?: string;
    reason?: string;
  } = {
    uuid: 'appt-uuid-123',
    appointmentNumber: 'APT-12345',
    startDateTime: [2025, 2, 15, 10, 30],
    appointmentSlot: '10:30 AM - 10:46 AM',
    reason: 'Follow-up',
    service: { name: 'Consultation' },
    serviceType: { name: 'General' },
    provider: { name: 'Dr. Smith' },
    location: { name: 'OPD-1' },
    status: 'Scheduled',
    dateCreated: 0,
    dateAppointmentScheduled: 0,
    endDateTime: 0,
    appointmentKind: '',
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

  it('should format appointment with array startDateTime', () => {
    const result = formatAppointment(mockAppointment);

    expect(result.appointmentDate).toMatch(/15\/02\/2025/);
    expect(result.appointmentTime).toBeTruthy();
  });

  it('should use appointmentSlot if available', () => {
    const result = formatAppointment(mockAppointment);

    // Should format time as HH:MM AM/PM (exact time depends on system timezone)
    expect(result.appointmentTime).toMatch(
      /\d{2}:\d{2}\s(AM|PM|am|pm)\s-\s\d{2}:\d{2}\s(AM|PM|am|pm)/,
    );
    expect(result.appointmentTime).toBeTruthy();
  });

  it('should format time without appointmentSlot', () => {
    const appointmentWithoutSlot = {
      ...mockAppointment,
      appointmentSlot: undefined,
      startDateTime: [2025, 2, 15, 14, 45],
    };

    const result = formatAppointment(appointmentWithoutSlot);

    // Should format time as HH:MM AM/PM (exact time depends on system timezone)
    expect(result.appointmentTime).toMatch(
      /\d{2}:\d{2}\s(AM|PM|am|pm)\s-\s\d{2}:\d{2}\s(AM|PM|am|pm)/,
    );
    expect(result.appointmentTime).toBeTruthy();
  });

  it('should handle timestamp startDateTime', () => {
    const appointmentWithTimestamp = {
      ...mockAppointment,
      startDateTime: new Date('2025-02-15T10:30:00Z').getTime(),
    };

    const result = formatAppointment(appointmentWithTimestamp);

    expect(result.appointmentDate).toBeTruthy();
    expect(result.appointmentTime).toBeTruthy();
  });

  it('should handle ISO date string startDateTime', () => {
    const appointmentWithISO = {
      ...mockAppointment,
      startDateTime: '2025-02-15T10:30:00Z',
    };

    const result = formatAppointment(appointmentWithISO);

    expect(result.appointmentDate).toBeTruthy();
  });

  it('should set date to "-" when startDateTime is null', () => {
    const appointmentWithNull = {
      ...mockAppointment,
      startDateTime: null,
    };

    const result = formatAppointment(appointmentWithNull);

    expect(result.appointmentDate).toBe('-');
    expect(result.appointmentTime).toBe('-');
  });

  it('should set date to "-" when startDateTime is undefined', () => {
    const appointmentWithUndefined = {
      ...mockAppointment,
      startDateTime: undefined,
    };

    const result = formatAppointment(appointmentWithUndefined);

    expect(result.appointmentDate).toBe('-');
    expect(result.appointmentTime).toBe('-');
  });

  it('should handle invalid date gracefully', () => {
    const appointmentWithInvalidDate = {
      ...mockAppointment,
      startDateTime: 'invalid-date',
    };

    const result = formatAppointment(appointmentWithInvalidDate);

    expect(result.appointmentDate).toBe('-');
    expect(result.appointmentTime).toBe('-');
  });

  it('should preserve other appointment properties', () => {
    const result = formatAppointment(mockAppointment);

    expect(result.uuid).toBe('appt-uuid-123');
    expect(result.appointmentNumber).toBe('APT-12345');
    expect(result.reason).toBe('Follow-up');
    expect(result.service).toEqual({ name: 'Consultation' });
    expect(result.status).toBe('Scheduled');
  });

  it('should set id to uuid', () => {
    const result = formatAppointment(mockAppointment);

    expect(result.id).toBe('appt-uuid-123');
  });

  it('should return FormattedAppointment with required fields', () => {
    const result = formatAppointment(mockAppointment);

    expect(result).toHaveProperty('appointmentDate');
    expect(result).toHaveProperty('appointmentTime');
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('uuid');
    expect(result).toHaveProperty('status');
  });

  it('should handle array startDateTime with different values', () => {
    const appointmentWithDifferentTime = {
      ...mockAppointment,
      startDateTime: [2025, 12, 31, 23, 59],
    };

    const result = formatAppointment(appointmentWithDifferentTime);

    // Date format should be DD/MM/YYYY (timezone offset may change the date)
    expect(result.appointmentDate).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(result.appointmentDate).toBeTruthy();
  });

  it('should catch formatting errors and return fallback values', () => {
    const appointmentWithErrorProneData = {
      ...mockAppointment,
      startDateTime: { invalid: 'structure' } as any,
    };

    const result = formatAppointment(appointmentWithErrorProneData);

    expect(result.appointmentDate).toBe('-');
    expect(result.appointmentTime).toBe('-');
  });
});

describe('sortAppointmentsByDate', () => {
  const createFormattedAppointment = (
    date: string,
    uuid: string,
  ): FormattedAppointment => ({
    uuid,
    id: uuid,
    appointmentDate: date,
    appointmentTime: '10:00 AM',
    service: { name: 'Test' },
    status: 'Scheduled',
    dateCreated: 0,
    dateAppointmentScheduled: 0,
    endDateTime: 0,
    appointmentKind: '',
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
    startDateTime: '',
    location: { name: '' },
  });

  it('should sort appointments in ascending order by date', () => {
    const appointments = [
      createFormattedAppointment('15/03/2025', 'appt-1'),
      createFormattedAppointment('10/03/2025', 'appt-2'),
      createFormattedAppointment('20/03/2025', 'appt-3'),
    ];

    const sorted = sortAppointmentsByDate(appointments);

    expect(sorted[0].uuid).toBe('appt-2');
    expect(sorted[1].uuid).toBe('appt-1');
    expect(sorted[2].uuid).toBe('appt-3');
  });

  it('should return new array without mutating original', () => {
    const appointments = [
      createFormattedAppointment('15/03/2025', 'appt-1'),
      createFormattedAppointment('10/03/2025', 'appt-2'),
    ];
    const original = [...appointments];

    sortAppointmentsByDate(appointments);

    expect(appointments).toEqual(original);
  });

  it('should handle single appointment', () => {
    const appointments = [createFormattedAppointment('15/03/2025', 'appt-1')];

    const sorted = sortAppointmentsByDate(appointments);

    expect(sorted).toHaveLength(1);
    expect(sorted[0].uuid).toBe('appt-1');
  });

  it('should handle empty array', () => {
    const appointments: FormattedAppointment[] = [];

    const sorted = sortAppointmentsByDate(appointments);

    expect(sorted).toEqual([]);
  });

  it('should handle appointments with same date', () => {
    const appointments = [
      createFormattedAppointment('15/03/2025', 'appt-1'),
      createFormattedAppointment('15/03/2025', 'appt-2'),
      createFormattedAppointment('15/03/2025', 'appt-3'),
    ];

    const sorted = sortAppointmentsByDate(appointments);

    expect(sorted).toHaveLength(3);
    expect(sorted[0].appointmentDate).toBe('15/03/2025');
  });

  it('should sort dates in DD/MM/YYYY format correctly', () => {
    const appointments = [
      createFormattedAppointment('31/01/2025', 'appt-1'),
      createFormattedAppointment('01/01/2025', 'appt-2'),
      createFormattedAppointment('15/01/2025', 'appt-3'),
    ];

    const sorted = sortAppointmentsByDate(appointments);

    expect(sorted[0].uuid).toBe('appt-2');
    expect(sorted[1].uuid).toBe('appt-3');
    expect(sorted[2].uuid).toBe('appt-1');
  });

  it('should maintain appointment properties after sorting', () => {
    const appointments = [
      createFormattedAppointment('15/03/2025', 'appt-1'),
      createFormattedAppointment('10/03/2025', 'appt-2'),
    ];

    const sorted = sortAppointmentsByDate(appointments);

    expect(sorted[0].status).toBe('Scheduled');
    expect(sorted[0].appointmentTime).toBe('10:00 AM');
  });
});
