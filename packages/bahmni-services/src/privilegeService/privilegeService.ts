import { get } from '../api';
import { SESSION_URL } from '../constants/app';
import { getFormattedError } from '../errorHandling';
import { UserPrivilege } from './models';

/**
 * Fetches current user privileges from OpenMRS session API
 * @returns Promise that resolves to array of user privileges or null if failed
 * @throws Error if fetch fails
 */
export const getCurrentUserPrivileges = async (): Promise<
  UserPrivilege[] | null
> => {
  try {
    const session = await get<{
      user: {
        privileges: UserPrivilege[];
      };
    }>(SESSION_URL);
    return session?.user?.privileges ?? null;
  } catch (error) {
    const { message } = getFormattedError(error);
    throw new Error(message);
  }
};

/**
 * Check if user has a specific privilege by name
 * @param userPrivileges - Array of user privileges from session API
 * @param privilegeName - Name of the privilege to check
 * @returns true if user has the privilege, false otherwise
 */
export const hasPrivilege = (
  userPrivileges: UserPrivilege[] | null,
  privilegeName: string,
): boolean => {
  if (!userPrivileges || userPrivileges.length === 0) {
    return false;
  }

  return userPrivileges.some((privilege) => privilege.name === privilegeName);
};
