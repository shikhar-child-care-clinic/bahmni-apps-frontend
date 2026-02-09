import { Appointment } from '@bahmni/services';
import {
  formatAppointment,
  sortAppointmentsByDate,
  FormattedAppointment,
} from '../utils';

describe('formatAppointment', () => {
  const mockAppointment: Appointment & {
    appointmentSlot?: string;
    appointmentNumber?: string;
    reason?: string;
  } = {
    uuid: 'appt-uuid-123',
    appointmentNumber: 'APT-12345',
    startDateTime: '2025-02-15T10:30:00+05:30',
    endDateTime: '2025-02-15T10:46:00+05:30',
    appointmentSlot: '10:30 AM - 10:46 AM',
    reason: 'Follow-up',
    service: {
      name: 'Consultation',
      uuid: 'consultation-uuid',
      appointmentServiceId: 0,
      description: null,
      speciality: null,
      startTime: '',
      endTime: '',
      location: { name: 'OPD-1', uuid: 'location-uuid' },
      color: '',
      initialAppointmentStatus: null,
    },
    serviceType: null,
    provider: { name: 'Dr. Smith', uuid: 'provider-uuid' },
    location: { name: 'OPD-1', uuid: 'location-uuid' },
    status: 'booked',
    dateCreated: 0,
    dateAppointmentScheduled: 0,
    appointmentKind: 'Scheduled',
    comments: 'Follow-up',
    reasons: [{ conceptUuid: '', name: 'Follow-up' }],
    patient: {
      uuid: 'patient-uuid',
      identifier: 'ABC200001',
      name: 'John Doe',
      gender: '',
      birthDate: 0,
      age: 0,
      PatientIdentifier: 'ABC200001',
      customAttributes: [],
    },
  };

  it('should format appointment with ISO string startDateTime', () => {
    const result = formatAppointment(mockAppointment);

    expect(result.appointmentDate).toBeTruthy();
    expect(result.appointmentTime).toBeTruthy();
  });

  it('should format time from ISO string', () => {
    const result = formatAppointment(mockAppointment);

    // Should format time as HH:MM AM/PM
    expect(result.appointmentTime).toMatch(/\d{2}:\d{2}\s(AM|PM)/);
    expect(result.appointmentTime).toBeTruthy();
  });

  it('should format time with FHIR instant format including timezone', () => {
    const appointmentWithTZ = {
      ...mockAppointment,
      startDateTime: '2025-02-15T14:45:00+05:30',
      endDateTime: '2025-02-15T15:00:00+05:30',
    };

    const result = formatAppointment(appointmentWithTZ);

    expect(result.appointmentTime).toMatch(
      /\d{2}:\d{2}\s(AM|PM)\s-\s\d{2}:\d{2}\s(AM|PM)/,
    );
    expect(result.appointmentTime).toBeTruthy();
  });

  it('should handle timestamp startDateTime', () => {
    const appointmentWithTimestamp = {
      ...mockAppointment,
      startDateTime: new Date('2025-02-15T10:30:00Z').getTime(),
      endDateTime: new Date('2025-02-15T10:46:00Z').getTime(),
    };

    const result = formatAppointment(appointmentWithTimestamp);

    expect(result.appointmentDate).toBeTruthy();
    expect(result.appointmentTime).toBeTruthy();
  });

  it('should handle ISO date string startDateTime', () => {
    const appointmentWithISO = {
      ...mockAppointment,
      startDateTime: '2025-02-15T10:30:00Z',
      endDateTime: '2025-02-15T10:46:00Z',
    };

    const result = formatAppointment(appointmentWithISO);

    expect(result.appointmentDate).toBeTruthy();
  });

  it('should set date to "-" when startDateTime is null', () => {
    const appointmentWithNull = {
      ...mockAppointment,
      startDateTime: null,
      endDateTime: null,
    };

    const result = formatAppointment(appointmentWithNull);

    expect(result.appointmentDate).toBe('-');
    expect(result.appointmentTime).toBe('-');
  });

  it('should set date to "-" when startDateTime is undefined', () => {
    const appointmentWithUndefined = {
      ...mockAppointment,
      startDateTime: undefined,
      endDateTime: undefined,
    };

    const result = formatAppointment(appointmentWithUndefined);

    expect(result.appointmentDate).toBe('-');
    expect(result.appointmentTime).toBe('-');
  });

  it('should handle missing startDateTime gracefully', () => {
    const appointmentWithoutStart = {
      ...mockAppointment,
      startDateTime: null,
      endDateTime: null,
    };

    const result = formatAppointment(appointmentWithoutStart);

    expect(result.appointmentDate).toBe('-');
    expect(result.appointmentTime).toBe('-');
  });

  it('should preserve other appointment properties', () => {
    const result = formatAppointment(mockAppointment);

    expect(result.uuid).toBe('appt-uuid-123');
    expect(result.appointmentNumber).toBe('APT-12345');
    expect(result.reason).toBe('Follow-up');
    expect(result.service.name).toBe('Consultation');
    expect(result.status).toBe('booked');
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

  it('should handle different ISO date strings', () => {
    const appointmentWithDifferentTime = {
      ...mockAppointment,
      startDateTime: '2025-12-31T23:59:00+05:30',
      endDateTime: '2026-01-01T00:15:00+05:30',
    };

    const result = formatAppointment(appointmentWithDifferentTime);

    // Date format should be DD/MM/YYYY
    expect(result.appointmentDate).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(result.appointmentDate).toBeTruthy();
  });

  it('should handle appointments with only reason from comments', () => {
    const appointmentWithCommentsOnly = {
      ...mockAppointment,
      reasons: [],
      comments: 'General checkup',
    };

    const result = formatAppointment(appointmentWithCommentsOnly);

    expect(result.reason).toBe('General checkup');
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
