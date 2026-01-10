export const VALIDATION_RULES = {
  USERNAME: {
    REQUIRED: 'LOGIN_ERROR_USERNAME_REQUIRED',
    MIN_LENGTH: 2,
    MIN_LENGTH_MESSAGE: 'LOGIN_ERROR_USERNAME_TOO_SHORT',
  },
  PASSWORD: {
    REQUIRED: 'LOGIN_ERROR_PASSWORD_REQUIRED',
    MIN_LENGTH: 8,
    MIN_LENGTH_MESSAGE: 'LOGIN_ERROR_PASSWORD_TOO_SHORT',
  },
} as const;

export const validateUsername = (username: string): string | null => {
  if (!username || username.trim().length === 0) {
    return VALIDATION_RULES.USERNAME.REQUIRED;
  }
  if (username.trim().length < VALIDATION_RULES.USERNAME.MIN_LENGTH) {
    return VALIDATION_RULES.USERNAME.MIN_LENGTH_MESSAGE;
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password || password.length === 0) {
    return VALIDATION_RULES.PASSWORD.REQUIRED;
  }
  if (password.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
    return VALIDATION_RULES.PASSWORD.MIN_LENGTH_MESSAGE;
  }
  return null;
};

export const LOGIN_ERROR_CODES = {
  INVALID_CREDENTIALS: 'LOGIN_ERROR_INVALID_CREDENTIALS',
  NETWORK_ERROR: 'LOGIN_ERROR_NETWORK',
  SERVER_ERROR: 'LOGIN_ERROR_SERVER',
  GENERIC_ERROR: 'LOGIN_ERROR_GENERIC',
} as const;

export const getLoginErrorCode = (error: Error): string => {
  const errorMessage = error.message;

  switch (errorMessage) {
    case 'Unauthorized':
      return LOGIN_ERROR_CODES.INVALID_CREDENTIALS;
    case 'Network Error':
      return LOGIN_ERROR_CODES.NETWORK_ERROR;
    case 'Server Error':
      return LOGIN_ERROR_CODES.SERVER_ERROR;
    default:
      return LOGIN_ERROR_CODES.GENERIC_ERROR;
  }
};
