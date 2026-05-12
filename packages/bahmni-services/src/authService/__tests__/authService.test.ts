import axios from 'axios';
import { loginWithCredentials, AuthError } from '../index';
import { BAHMNI_USER_COOKIE_NAME } from '../../constants/app';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const clearCookies = () => {
  document.cookie
    .split(';')
    .map((c) => c.split('=')[0].trim())
    .filter(Boolean)
    .forEach((name) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
};

describe('authService.loginWithCredentials', () => {
  beforeEach(() => {
    clearCookies();
    jest.clearAllMocks();
  });

  it('sends Basic auth header with base64-encoded credentials', async () => {
    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: { authenticated: true, uuid: 'u1' },
    });

    await loginWithCredentials('superman', 'Admin123');

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    const [url, config] = mockedAxios.get.mock.calls[0];
    expect(url).toContain('/openmrs/ws/rest/v1/session');
    expect((config as { headers: { Authorization: string } }).headers.Authorization).toBe(
      `Basic ${btoa('superman:Admin123')}`,
    );
  });

  it('writes bahmni.user cookie on successful auth', async () => {
    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: { authenticated: true, uuid: 'u1' },
    });

    await loginWithCredentials('alice', 'pw');

    expect(document.cookie).toContain(`${BAHMNI_USER_COOKIE_NAME}=${encodeURIComponent('alice')}`);
  });

  it('throws invalid_credentials on 401', async () => {
    mockedAxios.get.mockResolvedValue({ status: 401, data: {} });

    await expect(loginWithCredentials('a', 'b')).rejects.toMatchObject({
      kind: 'invalid_credentials',
    });
    expect(document.cookie).not.toContain(BAHMNI_USER_COOKIE_NAME);
  });

  it('throws invalid_credentials on 200 with authenticated=false', async () => {
    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: { authenticated: false },
    });

    await expect(loginWithCredentials('a', 'b')).rejects.toBeInstanceOf(AuthError);
  });

  it('throws otp_required on 204', async () => {
    mockedAxios.get.mockResolvedValue({ status: 204, data: '' });

    await expect(loginWithCredentials('a', 'b')).rejects.toMatchObject({
      kind: 'otp_required',
    });
  });

  it('throws otp_required when body has firstFactAuthorization=true', async () => {
    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: { firstFactAuthorization: true },
    });

    await expect(loginWithCredentials('a', 'b')).rejects.toMatchObject({
      kind: 'otp_required',
    });
  });

  it('throws too_many_attempts on 429', async () => {
    mockedAxios.get.mockResolvedValue({ status: 429, data: {} });

    await expect(loginWithCredentials('a', 'b')).rejects.toMatchObject({
      kind: 'too_many_attempts',
    });
  });

  it('throws otp_expired on 410', async () => {
    mockedAxios.get.mockResolvedValue({ status: 410, data: {} });

    await expect(loginWithCredentials('a', 'b')).rejects.toMatchObject({
      kind: 'otp_expired',
    });
  });

  it('throws network on transport error', async () => {
    mockedAxios.get.mockRejectedValue(new Error('socket hang up'));

    await expect(loginWithCredentials('a', 'b')).rejects.toMatchObject({
      kind: 'network',
    });
  });

  it('does NOT use the global axios client (so 401 redirect interceptor is bypassed)', async () => {
    mockedAxios.get.mockResolvedValue({ status: 401, data: {} });
    // If the function used the global `client`, axios.get on the bare
    // mocked module would not be hit; this assertion lives implicitly
    // in the other tests, but spell it out:
    await expect(loginWithCredentials('a', 'b')).rejects.toBeInstanceOf(AuthError);
    expect(mockedAxios.get).toHaveBeenCalled();
  });
});
