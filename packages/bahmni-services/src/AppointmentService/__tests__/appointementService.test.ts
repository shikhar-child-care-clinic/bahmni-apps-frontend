import type { Appointment as FhirAppointment } from 'fhir/r4';
import { get } from '../../api';
import {
  getAppointmentById,
  getUpcomingAppointments,
  getPastAppointments,
} from '../appointmentService';
import {
  APPOINTMENT_BY_ID_URL,
  UPCOMING_APPOINTMENTS_URL,
  PAST_APPOINTMENTS_URL,
} from '../constants';
import { Appointment } from '../models';

jest.mock('../../api');
const mockedGet = get as jest.MockedFunction<typeof get>;

describe('Appointment Service - FHIR Implementation', () => {
  const mockFhirAppointment: FhirAppointment = {
    resourceType: 'Appointment',
    id: 'appt-uuid-1',
    identifier: [
      {
        system: 'urn:system:bahmni:appointments',
        value: 'APT-12345',
      },
    ],
    status: 'booked',
    serviceType: [
      {
        coding: [
          {
            code: 'consultation',
            display: 'Consultation',
          },
        ],
        text: 'Consultation',
      },
    ],
    start: '2025-02-15T10:30:00+05:30',
    end: '2025-02-15T10:46:00+05:30',
    comment: 'Follow-up visit',
    participant: [
      {
        actor: {
          reference: 'Patient/patient-uuid-1',
          display: 'John Doe (Patient Identifier: ABC200001)',
        },
        type: 'Patient',
        status: 'accepted',
      },
      {
        actor: {
          reference: 'Practitioner/provider-uuid',
          display: 'Dr. Smith',
        },
        type: 'Practitioner',
        status: 'accepted',
      },
      {
        actor: {
          reference: 'Location/location-uuid',
          display: 'OPD-1',
        },
        type: 'Location',
        status: 'accepted',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAppointmentById', () => {
    const mockUUID = 'appt-uuid-1';

    beforeEach(() => {
      jest.clearAllMocks();
      mockedGet.mockResolvedValue(mockFhirAppointment);
    });

    it('should call API with correct FHIR appointment URL', async () => {
      await getAppointmentById(mockUUID);

      expect(mockedGet).toHaveBeenCalledWith(APPOINTMENT_BY_ID_URL(mockUUID));
    });

    it('should return transformed Appointment from FHIR response', async () => {
      const result = await getAppointmentById(mockUUID);

      expect(result.uuid).toBe('appt-uuid-1');
      expect(result.appointmentNumber).toBe('APT-12345');
      expect(result.status).toBe('booked');
      expect(result.startDateTime).toBe('2025-02-15T10:30:00+05:30');
      expect(result.endDateTime).toBe('2025-02-15T10:46:00+05:30');
    });

    it('should extract patient details from FHIR participant', async () => {
      const result = await getAppointmentById(mockUUID);

      expect(result.patient.name).toBe('John Doe');
      expect(result.patient.identifier).toBe('ABC200001');
      expect(result.patient.uuid).toBe('patient-uuid-1');
    });

    it('should extract provider details from FHIR participant', async () => {
      const result = await getAppointmentById(mockUUID);

      expect(result.provider).not.toBeNull();
      expect(result.provider?.name).toBe('Dr. Smith');
      expect(result.provider?.uuid).toBe('provider-uuid');
    });

    it('should extract location details from FHIR participant', async () => {
      const result = await getAppointmentById(mockUUID);

      expect(result.location.name).toBe('OPD-1');
      expect(result.location.uuid).toBe('location-uuid');
    });

    it('should extract service details from serviceType', async () => {
      const result = await getAppointmentById(mockUUID);

      expect(result.service.name).toBe('Consultation');
    });

    it('should extract reason from comment field', async () => {
      const result = await getAppointmentById(mockUUID);

      expect(result.comments).toBe('Follow-up visit');
      expect(result.reasons).toHaveLength(1);
      expect(result.reasons[0].name).toBe('Follow-up visit');
    });

    it('should handle appointment without provider', async () => {
      const appointmentWithoutProvider: FhirAppointment = {
        ...mockFhirAppointment,
        participant: mockFhirAppointment.participant?.filter(
          (p) => p.type !== 'Practitioner',
        ),
      };
      mockedGet.mockResolvedValue(appointmentWithoutProvider);

      const result = await getAppointmentById(mockUUID);

      expect(result.provider).toBeNull();
    });

    it('should handle appointment without comment/reason', async () => {
      const appointmentWithoutComment: FhirAppointment = {
        ...mockFhirAppointment,
        comment: undefined,
      };
      mockedGet.mockResolvedValue(appointmentWithoutComment);

      const result = await getAppointmentById(mockUUID);

      expect(result.comments).toBeNull();
      expect(result.reasons).toHaveLength(0);
    });

    it('should preserve FHIR instant format in startDateTime and endDateTime', async () => {
      const result = await getAppointmentById(mockUUID);

      // FHIR instant format includes timezone
      expect(result.startDateTime).toContain('T');
      expect(result.startDateTime).toContain('+05:30');
      expect(result.endDateTime).toContain('T');
      expect(result.endDateTime).toContain('+05:30');
    });
  });

  describe('getUpcomingAppointments', () => {
    const patientUUID = 'patient-uuid-123';
    const mockFutureFhirAppointment: FhirAppointment = {
      ...mockFhirAppointment,
      id: 'future-appt-1',
      start: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      end: new Date(Date.now() + 86400000 + 960000).toISOString(),
      status: 'booked',
    };

    const mockFhirBundle = {
      resourceType: 'Bundle' as const,
      type: 'searchset' as const,
      entry: [
        {
          resource: mockFutureFhirAppointment,
        },
      ],
    };

    it('should call GET with correct FHIR endpoint', async () => {
      mockedGet.mockResolvedValue(mockFhirBundle);

      await getUpcomingAppointments(patientUUID);

      expect(mockedGet).toHaveBeenCalledWith(
        UPCOMING_APPOINTMENTS_URL(patientUUID),
      );
    });

    it('should return transformed upcoming appointments', async () => {
      mockedGet.mockResolvedValue(mockFhirBundle);

      const result = await getUpcomingAppointments(patientUUID);

      expect(result).toHaveLength(1);
      expect(result[0].uuid).toBe('future-appt-1');
      expect(result[0].status).toBe('booked');
    });

    it('should return appointments with any valid status from server', async () => {
      const cancelledAppointment: FhirAppointment = {
        ...mockFhirAppointment,
        id: 'cancelled-appt-1',
        start: mockFutureFhirAppointment.start,
        end: mockFutureFhirAppointment.end,
        status: 'cancelled',
      };

      const bundleWithCancelled = {
        resourceType: 'Bundle' as const,
        type: 'searchset' as const,
        entry: [
          { resource: mockFutureFhirAppointment },
          { resource: cancelledAppointment },
        ],
      };

      mockedGet.mockResolvedValue(bundleWithCancelled);

      const result = await getUpcomingAppointments(patientUUID);

      // Server returns all appointments regardless of status
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no upcoming appointments', async () => {
      const emptyBundle = {
        resourceType: 'Bundle' as const,
        type: 'searchset' as const,
        entry: [],
      };

      mockedGet.mockResolvedValue(emptyBundle);

      const result = await getUpcomingAppointments(patientUUID);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle missing entry in bundle', async () => {
      const bundleWithoutEntry = {
        resourceType: 'Bundle' as const,
        type: 'searchset' as const,
      };

      mockedGet.mockResolvedValue(bundleWithoutEntry);

      const result = await getUpcomingAppointments(patientUUID);

      expect(result).toEqual([]);
    });

    it('should propagate API errors', async () => {
      const mockError = new Error('FHIR API Error');
      mockedGet.mockRejectedValue(mockError);

      await expect(getUpcomingAppointments(patientUUID)).rejects.toThrow(
        'FHIR API Error',
      );
    });
  });

  describe('getPastAppointments', () => {
    const patientUUID = 'patient-uuid-456';
    const mockPastFhirAppointment: FhirAppointment = {
      ...mockFhirAppointment,
      id: 'past-appt-1',
      start: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      end: new Date(Date.now() - 86400000 + 960000).toISOString(),
      status: 'fulfilled',
    };

    const mockFhirBundle = {
      resourceType: 'Bundle' as const,
      type: 'searchset' as const,
      entry: [
        {
          resource: mockPastFhirAppointment,
        },
      ],
    };

    it('should call GET with correct FHIR endpoint', async () => {
      mockedGet.mockResolvedValue(mockFhirBundle);

      await getPastAppointments(patientUUID);

      expect(mockedGet).toHaveBeenCalledWith(
        PAST_APPOINTMENTS_URL(patientUUID),
      );
    });

    it('should return transformed past appointments', async () => {
      mockedGet.mockResolvedValue(mockFhirBundle);

      const result = await getPastAppointments(patientUUID);

      expect(result).toHaveLength(1);
      expect(result[0].uuid).toBe('past-appt-1');
      expect(result[0].status).toBe('fulfilled');
    });

    it('should return appointments from server bundle', async () => {
      const futureAppointment: FhirAppointment = {
        ...mockFhirAppointment,
        id: 'future-appt-1',
        start: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        end: new Date(Date.now() + 86400000 + 960000).toISOString(),
        status: 'booked',
      };

      const bundleWithMixed = {
        resourceType: 'Bundle' as const,
        type: 'searchset' as const,
        entry: [
          { resource: mockPastFhirAppointment },
          { resource: futureAppointment },
        ],
      };

      mockedGet.mockResolvedValue(bundleWithMixed);

      const result = await getPastAppointments(patientUUID);

      // Server returns all appointments in the bundle
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no past appointments', async () => {
      const emptyBundle = {
        resourceType: 'Bundle' as const,
        type: 'searchset' as const,
        entry: [],
      };

      mockedGet.mockResolvedValue(emptyBundle);

      const result = await getPastAppointments(patientUUID);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle multiple past appointments', async () => {
      const secondPastAppointment: FhirAppointment = {
        ...mockFhirAppointment,
        id: 'past-appt-2',
        start: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        end: new Date(Date.now() - 172800000 + 960000).toISOString(),
        status: 'fulfilled',
      };

      const bundleWithMultiple = {
        resourceType: 'Bundle' as const,
        type: 'searchset' as const,
        entry: [
          { resource: mockPastFhirAppointment },
          { resource: secondPastAppointment },
        ],
      };

      mockedGet.mockResolvedValue(bundleWithMultiple);

      const result = await getPastAppointments(patientUUID);

      expect(result).toHaveLength(2);
    });

    it('should propagate API errors', async () => {
      const mockError = new Error('FHIR API Error');
      mockedGet.mockRejectedValue(mockError);

      await expect(getPastAppointments(patientUUID)).rejects.toThrow(
        'FHIR API Error',
      );
    });

    it('should work with different patient UUIDs', async () => {
      const differentUUID = 'patient-uuid-789';
      mockedGet.mockResolvedValue(mockFhirBundle);

      await getPastAppointments(differentUUID);

      expect(mockedGet).toHaveBeenCalledWith(
        PAST_APPOINTMENTS_URL(differentUUID),
      );
    });
  });
});
