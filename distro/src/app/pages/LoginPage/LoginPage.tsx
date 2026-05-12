import {
  Button,
  Dropdown,
  Form,
  InlineNotification,
  PasswordInput,
  TextInput,
} from '@carbon/react';
import {
  AUTH_ERROR_KEYS,
  AuthError,
  BAHMNI_USER_LOCATION_COOKIE,
  fetchWhiteLabelConfig,
  getAvailableLocations,
  getCookieByName,
  loginWithCredentials,
  setCookie,
  stripHeaderHtml,
  updateSessionLocation,
  type UserLocation,
  type WhiteLabelConfig,
} from '@bahmni/services';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles/LoginPage.module.scss';

type Phase = 'credentials' | 'location';

// Minimal English strings — no i18n bundle is registered for v2 login keys
// yet, so calling t('LOGIN_LABEL_*') returns the key itself rather than a
// translation. Inline strings until we wire up a translation bundle (tracked
// separately).
const STRINGS = {
  username: 'Username',
  password: 'Password',
  signIn: 'Sign in',
  signingIn: 'Signing in…',
  continue: 'Continue',
  location: 'Location',
  loginFailed: 'Login failed',
  missingCreds: 'Please enter both username and password.',
  noLocations:
    'Your account is not assigned to any login locations. Contact an administrator.',
  errorMessages: {
    INVALID_CREDENTIALS: 'Invalid username or password.',
    OTP_REQUIRED: 'A one-time password is required to continue.',
    OTP_EXPIRED: 'Your one-time password has expired. Please log in again.',
    LOCKED: 'Too many failed attempts. Try again in a few minutes.',
    NETWORK: 'Could not reach the server. Check your connection and retry.',
  } as Record<string, string>,
};

const readCachedLocation = (): UserLocation | null => {
  const raw = getCookieByName(BAHMNI_USER_LOCATION_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as UserLocation;
  } catch {
    return null;
  }
};

const messageForError = (err: unknown): string => {
  if (err instanceof AuthError) {
    return STRINGS.errorMessages[err.kind] ?? STRINGS.errorMessages.NETWORK;
  }
  return STRINGS.errorMessages.NETWORK;
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const [whiteLabel, setWhiteLabel] = useState<WhiteLabelConfig>({});
  const [phase, setPhase] = useState<Phase>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    fetchWhiteLabelConfig().then(setWhiteLabel);
  }, []);

  const clinicName = useMemo(
    () => stripHeaderHtml(whiteLabel.homePage?.header_text ?? ''),
    [whiteLabel.homePage?.header_text],
  );
  const subtitle = whiteLabel.homePage?.title_text ?? '';
  const logo = whiteLabel.homePage?.logo;

  const completeLogin = async (location: UserLocation) => {
    setCookie(
      BAHMNI_USER_LOCATION_COOKIE,
      encodeURIComponent(JSON.stringify(location)),
    );
    try {
      await updateSessionLocation(location.uuid);
    } catch (err) {
      console.warn('updateSessionLocation failed; continuing', err);
    }
    navigate('/', { replace: true });
  };

  const onCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError(STRINGS.missingCreds);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await loginWithCredentials(username, password);

      const available = await getAvailableLocations();
      setLocations(available);

      const cached = readCachedLocation();
      const cachedStillValid =
        cached && available.some((l) => l.uuid === cached.uuid);

      if (cachedStillValid && cached) {
        await completeLogin(cached);
        return;
      }

      if (available.length === 0) {
        setError(STRINGS.noLocations);
        return;
      }
      if (available.length === 1) {
        await completeLogin(available[0]);
        return;
      }

      setSelectedLocation(available[0]);
      setPhase('location');
    } catch (err) {
      // AUTH_ERROR_KEYS imported only to keep error-kind taxonomy aligned
      // with authService; the human-readable message comes from STRINGS.
      void AUTH_ERROR_KEYS;
      setError(messageForError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) return;
    setSubmitting(true);
    try {
      await completeLogin(selectedLocation);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.loginShell}>
      <div className={styles.card} role="main" aria-label="Login">
        <div className={styles.brandHeader}>
          {logo && (
            <img
              src={logo}
              alt={clinicName || 'Bahmni'}
              className={styles.logo}
              data-testid="login-logo"
            />
          )}
          {clinicName && (
            <div className={styles.clinicName} data-testid="login-clinic-name">
              {clinicName}
            </div>
          )}
          {subtitle && (
            <div className={styles.subtitle} data-testid="login-subtitle">
              {subtitle}
            </div>
          )}
        </div>

        {phase === 'credentials' && (
          <Form onSubmit={onCredentialsSubmit} data-testid="login-form">
            <div className={styles.field}>
              <TextInput
                id="login-username"
                labelText={STRINGS.username}
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUsername(e.target.value)
                }
                required
                autoFocus
                autoComplete="username"
                data-testid="login-username"
              />
            </div>
            <div className={styles.field}>
              <PasswordInput
                id="login-password"
                labelText={STRINGS.password}
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                required
                autoComplete="current-password"
                data-testid="login-password"
              />
            </div>
            {error && (
              <InlineNotification
                kind="error"
                title={STRINGS.loginFailed}
                subtitle={error}
                hideCloseButton
                className={styles.error}
                data-testid="login-error"
              />
            )}
            <div className={styles.actions}>
              <Button
                type="submit"
                disabled={submitting}
                data-testid="login-submit"
              >
                {submitting
                  ? STRINGS.signingIn
                  : STRINGS.signIn}
              </Button>
            </div>
          </Form>
        )}

        {phase === 'location' && (
          <Form onSubmit={onLocationSubmit} data-testid="login-location-form">
            <div className={styles.field}>
              <Dropdown
                id="login-location"
                titleText={STRINGS.location}
                label={selectedLocation?.name ?? ''}
                items={locations}
                itemToString={(item: UserLocation | null) =>
                  item?.display ?? item?.name ?? ''
                }
                selectedItem={selectedLocation}
                onChange={({ selectedItem }: { selectedItem: UserLocation }) =>
                  setSelectedLocation(selectedItem)
                }
                data-testid="login-location-dropdown"
              />
            </div>
            <div className={styles.actions}>
              <Button
                type="submit"
                disabled={submitting || !selectedLocation}
                data-testid="login-location-submit"
              >
                {submitting
                  ? STRINGS.signingIn
                  : STRINGS.continue}
              </Button>
            </div>
          </Form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
