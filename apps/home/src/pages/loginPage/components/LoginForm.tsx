import {
  PasswordInput,
  TextInput,
  Button,
  InlineNotification,
} from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import type { LoginCredentials } from '@bahmni/services';
import { useState } from 'react';
import { validateUsername, validatePassword } from '../utils';
import styles from './LoginForm.module.scss';

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => void;
  isLoading: boolean;
  error: string | null;
}

export const LoginForm = ({ onSubmit, isLoading, error }: LoginFormProps) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const usernameValidation = validateUsername(username);
    const passwordValidation = validatePassword(password);

    setUsernameError(usernameValidation);
    setPasswordError(passwordValidation);

    if (!usernameValidation && !passwordValidation) {
      onSubmit({ username, password });
    }
  };

  return (
    <div
      id="login-container"
      data-testid="login-container-test-id"
      aria-label="login-container-aria-label"
      className={styles.container}
    >
      <div
        id="login-header"
        data-testid="login-header-test-id"
        aria-label="login-header-aria-label"
        className={styles.header}
      >
        <h1>{t('LOGIN_PAGE_TITLE')}</h1>
      </div>

      <form
        id="login-form"
        data-testid="login-form-test-id"
        aria-label="login-form-aria-label"
        onSubmit={handleSubmit}
        className={styles.form}
      >
        {error && (
          <InlineNotification
            id="login-error-notification"
            data-testid="login-error-notification-test-id"
            aria-label="login-error-notification-aria-label"
            kind="error"
            title={t('LOGIN_ERROR')}
            subtitle={t(error)}
            lowContrast
          />
        )}

        <TextInput
          id="login-username"
          testId="login-username-test-id"
          aria-label="login-username-aria-label"
          labelText={t('LOGIN_LABEL_USERNAME')}
          placeholder={t('LOGIN_MESSAGE_ENTER_USERNAME')}
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setUsernameError(null);
          }}
          invalid={!!usernameError}
          invalidText={usernameError ? t(usernameError) : ''}
          disabled={isLoading}
          autoComplete="username"
        />

        <PasswordInput
          id="login-password"
          testId="login-password-test-id"
          aria-label="login-password-aria-label"
          type="password"
          labelText={t('LOGIN_LABEL_PASSWORD')}
          placeholder={t('LOGIN_MESSAGE_ENTER_PASSWORD')}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError(null);
          }}
          hidePasswordLabel={t('LOGIN_PAGE_HIDE_PASSWORD')}
          showPasswordLabel={t('LOGIN_PAGE_SHOW_PASSWORD')}
          invalid={!!passwordError}
          invalidText={passwordError ? t(passwordError) : ''}
          disabled={isLoading}
          autoComplete="current-password"
        />

        <Button
          id="login-submitBtn"
          testId="login-submitBtn-test-id"
          aria-label="login-submitBtn-aria-label"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? t('LOGIN_LOADING') : t('LOGIN_LABEL_LOGIN')}
        </Button>
      </form>
    </div>
  );
};
