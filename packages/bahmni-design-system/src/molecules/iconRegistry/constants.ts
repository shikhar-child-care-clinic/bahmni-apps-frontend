export const BAHMNI_ICON_NAMES = {
  REGISTRATION: 'registration',
  CLINICAL: 'clinical',
  PROGRAMS: 'programs',
  RADIOLOGY: 'radiology',
  PATIENT_DOCUMENTS: 'patient_documents',
  BED_MANAGEMENT: 'bed_management',
  ADMIN: 'admin',
  REPORTS: 'reports',
  OPERATION_THEATRE: 'operation_theatre',
  ORDERS: 'orders',
  IMPLEMENTER_INTERFACE: 'implementer_interface',
  ATOMFEED_CONSOLE: 'atomfeed_console',
  APPOINTMENT_SCHEDULING: 'appointment_scheduling',
  LAB_LITE: 'lab_lite',
  NAVIGATION: 'navigation',
} as const;

export type BahmniIconName =
  (typeof BAHMNI_ICON_NAMES)[keyof typeof BAHMNI_ICON_NAMES];
