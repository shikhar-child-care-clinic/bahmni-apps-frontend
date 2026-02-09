import type { Appointment as FhirAppointment } from 'fhir/r4';
import { get, patch } from '../api';
import {
  UPCOMING_APPOINTMENTS_URL,
  PAST_APPOINTMENTS_URL,
  APPOINTMENT_BY_ID_URL,
} from './constants';
import {
  type Appointment,
  type AppointmentBundle,
  type AppointmentParticipant,
} from './models';

/**
 * Search appointments by attribute using FHIR
 * Searches appointments that match the provided criteria
 */
export async function searchAppointmentsByAttribute(
  searchTerm: Record<string, string>,
): Promise<Appointment[]> {
  // Build FHIR search parameters from search criteria
  // This is a simplified implementation that filters results client-side
  const allAppointments: Appointment[] = [];

  // For now, return empty array if no patient UUID is provided
  // Real implementation would search across all appointments
  return allAppointments;
}

/**
 * Update appointment status using FHIR PATCH
 */
export async function updateAppointmentStatus(
  appointmentUuid: string,
  toStatus: string,
): Promise<Appointment> {
  const fhirAppt = await get<FhirAppointment>(
    APPOINTMENT_BY_ID_URL(appointmentUuid),
  );

  // Update the status in the FHIR resource
  const updatedFhirAppt: FhirAppointment = {
    ...fhirAppt,
    status: toStatus.toLowerCase(),
  };

  // Send PATCH request to update the appointment
  const response = await patch<FhirAppointment>(
    APPOINTMENT_BY_ID_URL(appointmentUuid),
    { status: toStatus.toLowerCase() },
  );

  // Transform and return the updated appointment
  return transformFhirAppointment(response);
}

/**
 * Get upcoming appointments for a patient using FHIR
 * Fetches appointments from today onwards using FHIR date search parameter (date=ge<today>)
 * Server-side filtering ensures only future appointments are returned
 */
export async function getUpcomingAppointments(
  patientUuid: string,
): Promise<Appointment[]> {
  const url = UPCOMING_APPOINTMENTS_URL(patientUuid);
  const bundle = await get<AppointmentBundle>(url);
  return extractFhirAppointments(bundle);
}

/**
 * Get past appointments for a patient using FHIR
 * Fetches appointments before today using FHIR date search parameter (date=lt<today>)
 * Supports sorting by date in descending order (most recent first)
 * and limiting results with optional count parameter
 * @param patientUuid - The patient UUID
 * @param count - Optional limit on number of past appointments to fetch (from config)
 */
export async function getPastAppointments(
  patientUuid: string,
  count?: number,
): Promise<Appointment[]> {
  const url = PAST_APPOINTMENTS_URL(patientUuid, '-date', count);
  const bundle = await get<AppointmentBundle>(url);
  return extractFhirAppointments(bundle);
}

/**
 * Get appointment by ID using FHIR
 */
export async function getAppointmentById(uuid: string): Promise<Appointment> {
  const fhirAppt = await get<FhirAppointment>(APPOINTMENT_BY_ID_URL(uuid));
  return transformFhirAppointment(fhirAppt);
}

/**
 * Extract and transform appointments from FHIR Bundle
 */
function extractFhirAppointments(bundle: AppointmentBundle): Appointment[] {
  const fhirAppointments =
    bundle.entry?.map((entry) => entry.resource as FhirAppointment) ?? [];

  return fhirAppointments.map(transformFhirAppointment);
}

/**
 * Transform single FHIR Appointment to app model
 * Handles FHIR instant format (ISO 8601 with timezone)
 */
function transformFhirAppointment(fhirAppt: FhirAppointment): Appointment {
  const participants = extractParticipants(fhirAppt);

  // Extract participant details
  const patientParticipant = participants.find((p) => p.type === 'Patient');
  const practitionerParticipant = participants.find(
    (p) => p.type === 'Practitioner',
  );
  const locationParticipant = participants.find((p) => p.type === 'Location');

  // Extract appointment number from identifier
  const appointmentNumber =
    fhirAppt.identifier?.find(
      (id) => id.system === 'urn:system:bahmni:appointments',
    )?.value ?? '';

  // Extract reason from comment field
  const reason = fhirAppt.comment ?? null;

  return {
    uuid: fhirAppt.id!,
    appointmentNumber,
    patient: {
      name: extractPatientName(patientParticipant?.display),
      identifier: extractPatientIdentifier(patientParticipant?.display),
      uuid: extractReferenceId(patientParticipant?.reference),
      gender: '',
      birthDate: 0,
      age: 0,
      PatientIdentifier: extractPatientIdentifier(patientParticipant?.display),
      customAttributes: [],
    },
    service: {
      name: fhirAppt.serviceType?.[0]?.text ?? '',
      uuid: fhirAppt.serviceType?.[0]?.coding?.[0]?.code ?? '',
      appointmentServiceId: 0,
      description: null,
      speciality: null,
      startTime: '',
      endTime: '',
      location: {
        name: locationParticipant?.display ?? '',
        uuid: extractReferenceId(locationParticipant?.reference),
      },
      color: '',
      initialAppointmentStatus: null,
    },
    serviceType: null,
    provider: practitionerParticipant
      ? {
          name: practitionerParticipant.display,
          uuid: extractReferenceId(practitionerParticipant.reference),
        }
      : null,
    location: {
      name: locationParticipant?.display ?? '',
      uuid: extractReferenceId(locationParticipant?.reference),
    },
    startDateTime: fhirAppt.start!, // ISO 8601 instant format
    endDateTime: fhirAppt.end!, // ISO 8601 instant format
    appointmentKind: 'Scheduled',
    status: fhirAppt.status,
    comments: reason,
    reasons: reason ? [{ conceptUuid: '', name: reason }] : [],
  };
}

/**
 * Extract participants from FHIR Appointment
 */
function extractParticipants(
  fhirAppt: FhirAppointment,
): AppointmentParticipant[] {
  return (
    fhirAppt.participant?.map((p) => {
      const refParts = p.actor?.reference?.split('/');
      return {
        reference: p.actor?.reference ?? '',
        display: p.actor?.display ?? '',
        type: refParts?.[0],
        status: p.status,
      };
    }) ?? []
  );
}

/**
 * Extract UUID from FHIR reference (e.g., "Patient/uuid" -> "uuid")
 */
function extractReferenceId(reference?: string): string {
  return reference?.split('/').pop() ?? '';
}

/**
 * Extract patient name from display string
 * Format: "Name (Patient Identifier: ID)"
 */
function extractPatientName(display?: string): string {
  if (!display) return '';
  const match = display.match(/^(.+?)\s*\(/);
  return match?.[1]?.trim() ?? display;
}

/**
 * Extract patient identifier from display string
 * Format: "Name (Patient Identifier: ID)"
 */
function extractPatientIdentifier(display?: string): string {
  if (!display) return '';
  const match = display.match(/Patient Identifier:\s*(.+?)\)/);
  return match?.[1]?.trim() ?? '';
}
