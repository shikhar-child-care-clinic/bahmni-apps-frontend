export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SessionUser {
  uuid: string;
  username: string;
  systemId?: string;
  userProperties?: Record<string, unknown>;
}

export interface SessionResponse {
  authenticated: boolean;
  user?: SessionUser;
  sessionId?: string;
  locale?: string;
}
