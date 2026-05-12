export interface SessionResponse {
  authenticated: boolean;
  uuid?: string;
  user?: {
    uuid: string;
    display: string;
    username: string;
  };
  sessionLocation?: {
    uuid: string;
    display: string;
  } | null;
}

export type AuthErrorKind =
  | 'invalid_credentials'
  | 'otp_required'
  | 'otp_expired'
  | 'otp_wrong'
  | 'too_many_attempts'
  | 'network';

export class AuthError extends Error {
  kind: AuthErrorKind;
  i18nKey: string;
  constructor(kind: AuthErrorKind, i18nKey: string, message?: string) {
    super(message ?? i18nKey);
    this.name = 'AuthError';
    this.kind = kind;
    this.i18nKey = i18nKey;
  }
}
