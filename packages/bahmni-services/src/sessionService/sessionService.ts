import { get, post, del } from '../api';
import { getFormattedError } from '../errorHandling';
import {
  SESSION_URL,
  BAHMNI_USER_COOKIE,
  BAHMNI_USER_LOCATION_COOKIE,
} from './constants';
import { LoginCredentials, SessionResponse } from './models';
import { deleteCookie, setCookie } from './utils';

export const loginUser = async (
  credentials: LoginCredentials,
): Promise<SessionResponse> => {
  try {
    const authHeader = btoa(`${credentials.username}:${credentials.password}`);

    const sessionData = await get<SessionResponse>(SESSION_URL, {
      headers: {
        Authorization: `Basic ${authHeader}`,
      },
    });

    if (sessionData.authenticated && sessionData.user) {
      setCookie(BAHMNI_USER_COOKIE, sessionData.user.username);
    }

    return sessionData;
  } catch (error) {
    const { title } = getFormattedError(error);
    throw new Error(title);
  }
};

export const updateSessionLocation = async (
  locationUuid: string,
): Promise<SessionResponse> => {
  const sessionData = await post<SessionResponse, { sessionLocation: string }>(
    SESSION_URL,
    { sessionLocation: locationUuid },
  );

  setCookie(BAHMNI_USER_LOCATION_COOKIE, locationUuid);

  return sessionData;
};

export const logoutUser = async (): Promise<void> => {
  try {
    await del(SESSION_URL);
  } finally {
    deleteCookie(BAHMNI_USER_COOKIE);
    deleteCookie(BAHMNI_USER_LOCATION_COOKIE);
  }
};

export const checkSession = async (): Promise<SessionResponse> => {
  return get<SessionResponse>(SESSION_URL);
};
