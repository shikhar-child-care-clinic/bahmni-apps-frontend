/**
<<<<<<< HEAD
 * Privilege constants for Consultation Pad sections
 *
 * Edit privileges (Add X) - allow full form with input controls
 * View privileges (View X) - allow read-only mode (left pane only)
 */
export const CONSULTATION_PAD_PRIVILEGES = {
  // Edit privileges - full access with input controls
  ALLERGIES: 'Add Allergies',
  INVESTIGATIONS: 'Add Orders',
  CONDITIONS_AND_DIAGNOSES: 'Add Diagnoses',
  MEDICATIONS: 'Add Medications',
  VACCINATIONS: 'Add Vaccinations',

  // View-only privileges - display left pane only
  VIEW_ALLERGIES: 'View Allergies',
  VIEW_INVESTIGATIONS: 'View Orders',
  VIEW_CONDITIONS_AND_DIAGNOSES: 'View Diagnoses',
  VIEW_MEDICATIONS: 'View Medications',
  VIEW_VACCINATIONS: 'View Vaccinations',
};
=======
 * Privilege names for consultation pad controls
 * These privileges control access to various consultation features
 */
export const CONSULTATION_PAD_PRIVILEGES = {
  ENCOUNTER: 'Add Encounters',
  ALLERGIES: 'Add Allergies',
  INVESTIGATIONS: 'Add Investigations',
  MEDICATIONS: 'Add Medications',
  OBSERVATIONS: 'Add Observations',
} as const;
>>>>>>> 688a8997 (BAH-4447 Add support for privilege checks in Consultation pad)
