export {
  searchAppointmentsByAttribute,
  updateAppointmentStatus,
  getAppointmentById,
  getUpcomingAppointments,
  getPastAppointments,
  getUpcomingAppointmentsPage,
  getPastAppointmentsPage,
  type AppointmentPage,
  getAllAppointmentServices,
  deleteAppointmentService,
} from './appointmentService';
export { type AppointmentService } from './models';
export {
  APPOINTMENT_STATUSES,
  APPOINTMENT_IDENTIFIER_SYSTEM,
} from './constants';
