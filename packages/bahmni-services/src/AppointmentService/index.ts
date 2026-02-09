export {
  searchAppointmentsByAttribute,
  updateAppointmentStatus,
  getAppointmentById,
  getUpcomingAppointments,
  getPastAppointments,
} from './appointmentService';
export {
  type Appointment,
  type AppointmentSearchResult,
  type Reason,
  type AppointmentBundle,
  type AppointmentParticipant,
  FHIR_APPOINTMENT_STATUSES,
} from './models';
