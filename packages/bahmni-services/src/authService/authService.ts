import axios from 'axios';
import { BAHMNI_USER_COOKIE_NAME } from '../constants/app';
import { setCookie } from '../utils';
import { AUTH_ERROR_KEYS, SESSION_URL } from './constants';
import { AuthError, SessionResponse } from './models';

/**
 * Authenticate against OpenMRS using the legacy Bahmni session endpoint.
 *
 * Mirrors the AngularJS bahmniapps `authentication.js` contract:
 *   GET /openmrs/ws/rest/v1/session?v=custom:(uuid)
 *   Authorization: Basic base64(username:password)
 *
 * On success (HTTP 200, body.authenticated === true) the function:
 *   - writes the `bahmni.user` cookie (URL-encoded username, path=/),
 *     so the rest of v2 (`getCurrentUser`, `getUserLoginLocation`,
 *     etc.) can recover the username from the cookie just like the
 *     legacy UI does.
 *   - resolves with the parsed SessionResponse.
 *
 * On failure throws a typed `AuthError`:
 *   - 401 -> 'invalid_credentials'
 *   - 410 -> 'otp_expired'        (only relevant if OTP is enabled
 *                                   server-side; we don't trigger it)
 *   - 429 -> 'too_many_attempts'
 *   - 204 -> 'otp_required'       (server says first-factor passed,
 *                                   second factor needed). We don't
 *                                   yet implement OTP; the caller
 *                                   should surface this to the user
 *                                   and not log them in.
 *   - any network/other error -> 'network'
 *
 * NOTE: this function intentionally uses a fresh axios instance so
 * the global `client.ts` 401 redirect interceptor does NOT fire on
 * a bad-password submission (which would loop the login page).
 */
export async function loginWithCredentials(
  username: string,
  password: string,
): Promise<SessionResponse> {
  const credentials = `${username}:${password}`;
  // btoa is browser-native and preserves UTF-8 only for ASCII; legacy
  // bahmniapps used the same approach so we match its limitations.
  const basicHeader = `Basic ${btoa(credentials)}`;

  let response;
  try {
    response = await axios.get<SessionResponse>(SESSION_URL, {
      headers: { Authorization: basicHeader },
      // Don't throw on non-2xx so we can branch on status (esp. 204).
      validateStatus: () => true,
    });
  } catch (_err) {
    throw new AuthError('network', AUTH_ERROR_KEYS.NETWORK);
  }

  const { status, data } = response;

  if (status === 204 || (data && (data as { firstFactAuthorization?: boolean }).firstFactAuthorization)) {
    throw new AuthError('otp_required', AUTH_ERROR_KEYS.OTP_REQUIRED);
  }
  if (status === 401) {
    throw new AuthError('invalid_credentials', AUTH_ERROR_KEYS.INVALID_CREDENTIALS);
  }
  if (status === 410) {
    throw new AuthError('otp_expired', AUTH_ERROR_KEYS.OTP_EXPIRED);
  }
  if (status === 429) {
    throw new AuthError('too_many_attempts', AUTH_ERROR_KEYS.TOO_MANY_ATTEMPTS);
  }
  if (status < 200 || status >= 300) {
    throw new AuthError('network', AUTH_ERROR_KEYS.NETWORK);
  }
  if (!data?.authenticated) {
    throw new AuthError('invalid_credentials', AUTH_ERROR_KEYS.INVALID_CREDENTIALS);
  }

  setCookie(BAHMNI_USER_COOKIE_NAME, encodeURIComponent(username));
  return data;
}
