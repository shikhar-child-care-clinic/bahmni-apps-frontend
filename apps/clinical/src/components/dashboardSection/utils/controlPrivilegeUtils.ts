import { hasPrivilege, UserPrivilege } from '@bahmni/services';
import { DashboardSectionConfig } from '../../../pages/models';

/**
 * Checks if a user can access a dashboard section based on control privileges
 * @param userPrivileges - Array of user privileges
 * @param section - Dashboard section configuration
 * @returns true if user can access at least one control in the section
 */
export const canUserAccessSection = (
  userPrivileges: UserPrivilege[] | null,
  section: DashboardSectionConfig,
): boolean => {
  // If section has no controls, user can access it
  if (!section.controls || section.controls.length === 0) {
    return true;
  }

  // Check if user has access to at least one control
  return section.controls.some((control) => {
    // If control has no required privileges, user can access it
    if (!control.requiredPrivileges || control.requiredPrivileges.length === 0) {
      return true;
    }

    // Check if user has all required privileges for this control
    return control.requiredPrivileges.every((privilege) =>
      hasPrivilege(userPrivileges, privilege),
    );
  });
};
