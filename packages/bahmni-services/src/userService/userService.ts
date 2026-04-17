import i18next from 'i18next';
import { get } from '../api';
import { BAHMNI_USER_COOKIE_NAME } from '../constants/app';
import { getCookieByName } from '../utils';
import {
  USER_RESOURCE_URL,
  BAHMNI_USER_LOCATION_COOKIE,
  APP_SETTINGS_URL,
  DEFAULT_DATE_FORMAT_PROPERTY,
} from './constants';
import {
  UserResponse,
  User,
  UserLocation,
  AppSettingsResponse,
} from './models';

export async function getCurrentUser(): Promise<User | null> {
  // Get username from cookie
  const encodedUsername = getCookieByName(BAHMNI_USER_COOKIE_NAME);
  if (!encodedUsername) {
    return null;
  }
  try {
    // Decode username from cookie value (handles URL encoding and quotes)
    const username = decodeURIComponent(encodedUsername).replace(
      /^"(.*)"$/,
      '$1',
    );
    // Get User from REST API
    const userResponse = await get<UserResponse>(USER_RESOURCE_URL(username));
    if (!userResponse.results || userResponse.results.length === 0) {
      return null;
    }

    return userResponse.results[0];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    const msg = i18next.t('ERROR_FETCHING_USER_DETAILS');
    // eslint-disable-next-line no-console
    console.trace(
      '[getUserLoginLocation] i18next msg:',
      JSON.stringify(msg),
      'i18next initialized:',
      i18next.isInitialized,
    );
    throw new Error(msg);
  }
}

/**
 * Fetches user's log in location details from the cache.
 * @returns The user's log in location if valid
 * @returns null if user location cookie not found or invalid
 * @throws Error when the user login location is null / invalid
 */
export const getUserLoginLocation = (): UserLocation => {
  const encodedUserLocation =
    getCookieByName(BAHMNI_USER_LOCATION_COOKIE) ?? null;
  if (!encodedUserLocation) {
    const msg = i18next.t('ERROR_FETCHING_USER_LOCATION_DETAILS');
    // eslint-disable-next-line no-console
    console.trace(
      '[getUserLoginLocation] missing cookie — i18next msg:',
      JSON.stringify(msg),
      'initialized:',
      i18next.isInitialized,
    );
    throw new Error(msg);
  }
  const userLocation: UserLocation = JSON.parse(
    decodeURIComponent(encodedUserLocation).replace(/^"(.*)"$/, '$1'),
  );
  if (!userLocation.uuid) {
    const msg = i18next.t('ERROR_FETCHING_USER_LOCATION_DETAILS');
    // eslint-disable-next-line no-console
    console.trace(
      '[getUserLoginLocation] missing uuid — i18next msg:',
      JSON.stringify(msg),
      'initialized:',
      i18next.isInitialized,
    );
    throw new Error(msg);
  }
  return userLocation;
};

/**
 * Get default date format from Bahmni app settings (commons module)
 * @returns Promise<string | null> - The default date format string (e.g., 'dd/MM/yyyy') or null if not found
 */
export const getDefaultDateFormat = async (): Promise<string | null> => {
  const settings = await get<AppSettingsResponse>(APP_SETTINGS_URL('commons'));
  const dateFormatSetting = settings.find(
    (setting) => setting.property === DEFAULT_DATE_FORMAT_PROPERTY,
  );
  return dateFormatSetting?.value ?? null;
};
