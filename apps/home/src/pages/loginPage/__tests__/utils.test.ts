import {
  validateUsername,
  validatePassword,
  VALIDATION_RULES,
  getLoginErrorCode,
  LOGIN_ERROR_CODES,
} from '../utils';

describe('validateUsername', () => {
  it('should return null for valid username', () => {
    const result = validateUsername('johndoe');
    expect(result).toBeNull();
  });

  it('should return null for valid username with minimum length', () => {
    const result = validateUsername('ab');
    expect(result).toBeNull();
  });

  it('should return null for username with whitespace that meets minimum length after trim', () => {
    const result = validateUsername('  john  ');
    expect(result).toBeNull();
  });

  it('should return error for empty username', () => {
    const result = validateUsername('');
    expect(result).toBe(VALIDATION_RULES.USERNAME.REQUIRED);
  });

  it('should return error for username with only whitespace', () => {
    const result = validateUsername('   ');
    expect(result).toBe(VALIDATION_RULES.USERNAME.REQUIRED);
  });

  it('should return error for username shorter than minimum length', () => {
    const result = validateUsername('a');
    expect(result).toBe(VALIDATION_RULES.USERNAME.MIN_LENGTH_MESSAGE);
  });

  it('should return error for username with whitespace that is too short after trim', () => {
    const result = validateUsername(' a ');
    expect(result).toBe(VALIDATION_RULES.USERNAME.MIN_LENGTH_MESSAGE);
  });

  it('should handle special characters in username', () => {
    const result = validateUsername('user@123');
    expect(result).toBeNull();
  });

  it('should handle numbers in username', () => {
    const result = validateUsername('user123');
    expect(result).toBeNull();
  });
});

describe('validatePassword', () => {
  it('should return null for valid password', () => {
    const result = validatePassword('password123');
    expect(result).toBeNull();
  });

  it('should return null for password with special characters', () => {
    const result = validatePassword('P@ssw0rd!');
    expect(result).toBeNull();
  });

  it('should return null for password with spaces', () => {
    const result = validatePassword('pass word 123');
    expect(result).toBeNull();
  });

  it('should return error for empty password', () => {
    const result = validatePassword('');
    expect(result).toBe(VALIDATION_RULES.PASSWORD.REQUIRED);
  });

  it('should return error for password shorter than minimum length', () => {
    const result = validatePassword('short');
    expect(result).toBe(VALIDATION_RULES.PASSWORD.MIN_LENGTH_MESSAGE);
  });

  it('should handle numeric-only password', () => {
    const result = validatePassword('123456789');
    expect(result).toBeNull();
  });

  it('should handle very long password', () => {
    const result = validatePassword('a'.repeat(100));
    expect(result).toBeNull();
  });
});

describe('getLoginErrorCode', () => {
  it('should return INVALID_CREDENTIALS for "Unauthorized" error', () => {
    const error = new Error('Unauthorized');
    const result = getLoginErrorCode(error);
    expect(result).toBe(LOGIN_ERROR_CODES.INVALID_CREDENTIALS);
  });

  it('should return NETWORK_ERROR for "Network Error"', () => {
    const error = new Error('Network Error');
    const result = getLoginErrorCode(error);
    expect(result).toBe(LOGIN_ERROR_CODES.NETWORK_ERROR);
  });

  it('should return SERVER_ERROR for "Server Error"', () => {
    const error = new Error('Server Error');
    const result = getLoginErrorCode(error);
    expect(result).toBe(LOGIN_ERROR_CODES.SERVER_ERROR);
  });

  it('should return GENERIC_ERROR for unknown error messages', () => {
    const error = new Error('Something went wrong');
    const result = getLoginErrorCode(error);
    expect(result).toBe(LOGIN_ERROR_CODES.GENERIC_ERROR);
  });
});
