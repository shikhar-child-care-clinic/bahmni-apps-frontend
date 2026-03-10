import { PatientSearchResult } from '../patientService/models';

export interface AppointmentSearchResult extends PatientSearchResult {
  appointmentUuid?: string;
  appointmentNumber?: string;
  appointmentDate?: string;
  appointmentReason?: string;
  appointmentStatus?: string;
}

export interface Appointment {
  uuid: string;
  appointmentNumber: string;
  dateCreated: number;
  dateAppointmentScheduled: number;
  patient: Patient;
  service: AppointmentService;
  serviceType: ServiceType | null;
  provider: Provider | null;
  location: Location;
  startDateTime: number;
  endDateTime: number;
  appointmentKind: string;
  status: string;
  comments: string | null;
  reasons: Reason[];
  appointmentSlot?: string;
}

export interface Patient {
  identifier: string;
  gender: string;
  name: string;
  uuid: string;
  birthDate: number;
  age: number;
  PatientIdentifier: string;
  customAttributes: [];
}

export interface Speciality {
  uuid: string;
  name: string;
}

export interface Location {
  name: string;
  uuid: string;
}

export interface AppointmentService {
  appointmentServiceId: number;
  uuid: string;
  name: string;
  description: string | null;
  speciality: Speciality | null;
  startTime: string;
  endTime: string;
  location: Location | null;
  durationMins?: number | null;
  color: string;
  initialAppointmentStatus: string | null;
}

export interface Provider {
  id?: number;
  name?: string;
  uuid?: string;
}

export interface Extensions {
  patientEmailDefined: boolean;
}

export interface Reason {
  conceptUuid: string;
  name: string;
}

export interface ServiceType {
  id?: number;
  name?: string;
  description?: string;
  uuid?: string;
}
