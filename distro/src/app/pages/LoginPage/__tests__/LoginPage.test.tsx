import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { LoginPage } from '../LoginPage';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('@bahmni/services', () => {
  class AuthError extends Error {
    kind: string;
    i18nKey: string;
    constructor(kind: string, i18nKey: string, message?: string) {
      super(message ?? kind);
      this.kind = kind;
      this.i18nKey = i18nKey;
    }
  }
  return {
    __esModule: true,
    AuthError,
    AUTH_ERROR_KEYS: {
      INVALID_CREDENTIALS: 'LOGIN_LABEL_LOGIN_ERROR_MESSAGE_KEY',
      NETWORK: 'LOGIN_LABEL_LOGIN_ERROR_MESSAGE_KEY',
      LOCKED: 'LOGIN_LABEL_LOCKED',
      OTP_REQUIRED: 'LOGIN_LABEL_OTP_REQUIRED',
      OTP_EXPIRED: 'LOGIN_LABEL_OTP_EXPIRED',
    },
    BAHMNI_USER_LOCATION_COOKIE: 'bahmni.user.location',
    fetchWhiteLabelConfig: jest.fn(),
    getAvailableLocations: jest.fn(),
    getCookieByName: jest.fn(),
    loginWithCredentials: jest.fn(),
    setCookie: jest.fn(),
    stripHeaderHtml: (raw?: string) =>
      !raw ? '' : raw.replace(/<[^>]+>/g, '').trim(),
    updateSessionLocation: jest.fn(),
    useTranslation: () => ({ t: (k: string) => k }),
  };
});

import {
  fetchWhiteLabelConfig,
  getAvailableLocations,
  getCookieByName,
  loginWithCredentials,
  setCookie,
  updateSessionLocation,
  AuthError,
} from '@bahmni/services';

const renderPage = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );

const fillCreds = (u = 'superman', p = 'Admin123') => {
  fireEvent.change(screen.getByTestId('login-username'), {
    target: { value: u },
  });
  fireEvent.change(screen.getByTestId('login-password'), {
    target: { value: p },
  });
};

const submitCreds = () =>
  fireEvent.submit(screen.getByTestId('login-form'));

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchWhiteLabelConfig as jest.Mock).mockResolvedValue({
      homePage: {
        header_text: '<b>SHIKHAR CHILD CARE</b>',
        title_text: 'Pediatrics | Vaccination | Pharmacy',
        logo: '/clinic.png',
      },
    });
    (getCookieByName as jest.Mock).mockReturnValue(null);
    (getAvailableLocations as jest.Mock).mockResolvedValue([]);
    (loginWithCredentials as jest.Mock).mockResolvedValue({});
    (updateSessionLocation as jest.Mock).mockResolvedValue({});
  });

  it('renders branding from whiteLabel config', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId('login-clinic-name')).toHaveTextContent(
        'SHIKHAR CHILD CARE',
      ),
    );
    expect(screen.getByTestId('login-subtitle')).toHaveTextContent(
      'Pediatrics | Vaccination | Pharmacy',
    );
    expect(screen.getByTestId('login-logo')).toHaveAttribute(
      'src',
      '/clinic.png',
    );
  });

  it('auto-completes when only one location is available', async () => {
    (getAvailableLocations as jest.Mock).mockResolvedValue([
      { uuid: 'loc-1', name: 'G-37/A', display: 'G-37/A' },
    ]);

    renderPage();
    fillCreds();
    submitCreds();

    await waitFor(() => expect(setCookie).toHaveBeenCalled());
    expect(loginWithCredentials).toHaveBeenCalledWith('superman', 'Admin123');
    expect(updateSessionLocation).toHaveBeenCalledWith('loc-1');
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    expect(screen.queryByTestId('login-location-form')).not.toBeInTheDocument();
  });

  it('auto-completes using cached location when still valid', async () => {
    (getCookieByName as jest.Mock).mockReturnValue(
      encodeURIComponent(JSON.stringify({ uuid: 'loc-2', name: 'G-37/A' })),
    );
    (getAvailableLocations as jest.Mock).mockResolvedValue([
      { uuid: 'loc-1', name: 'A', display: 'A' },
      { uuid: 'loc-2', name: 'G-37/A', display: 'G-37/A' },
    ]);

    renderPage();
    fillCreds();
    submitCreds();

    await waitFor(() =>
      expect(updateSessionLocation).toHaveBeenCalledWith('loc-2'),
    );
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('shows location picker when multiple locations and no valid cache', async () => {
    (getAvailableLocations as jest.Mock).mockResolvedValue([
      { uuid: 'loc-1', name: 'A', display: 'A' },
      { uuid: 'loc-2', name: 'B', display: 'B' },
    ]);

    renderPage();
    fillCreds();
    submitCreds();

    await waitFor(() =>
      expect(screen.getByTestId('login-location-form')).toBeInTheDocument(),
    );
    expect(updateSessionLocation).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows error notification on invalid credentials', async () => {
    (loginWithCredentials as jest.Mock).mockRejectedValue(
      new (AuthError as any)(
        'INVALID_CREDENTIALS',
        'LOGIN_LABEL_LOGIN_ERROR_MESSAGE_KEY',
      ),
    );

    renderPage();
    fillCreds('bad', 'creds');
    submitCreds();

    await waitFor(() =>
      expect(screen.getByTestId('login-error')).toBeInTheDocument(),
    );
    expect(getAvailableLocations).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('falls back to network error when error has no kind', async () => {
    (loginWithCredentials as jest.Mock).mockRejectedValue(new Error('boom'));

    renderPage();
    fillCreds();
    submitCreds();

    await waitFor(() =>
      expect(screen.getByTestId('login-error')).toBeInTheDocument(),
    );
  });

  it('shows no-locations error when API returns empty list', async () => {
    (getAvailableLocations as jest.Mock).mockResolvedValue([]);

    renderPage();
    fillCreds();
    submitCreds();

    await waitFor(() =>
      expect(screen.getByTestId('login-error')).toBeInTheDocument(),
    );
    expect(setCookie).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
