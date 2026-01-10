import { BaseLayout } from '@bahmni/design-system';
import { loginUser, type LoginCredentials } from '@bahmni/services';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from './components/LoginForm';
import styles from './LoginPage.module.scss';
import { getLoginErrorCode, LOGIN_ERROR_CODES } from './utils';

const LoginPage = () => {
  const navigate = useNavigate();

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoggingIn(true);
    setError(null);

    try {
      const sessionData = await loginUser(credentials);

      if (!sessionData.authenticated) {
        setError(LOGIN_ERROR_CODES.INVALID_CREDENTIALS);
        return;
      }

      navigate('/');
    } catch (err) {
      const errorCode = getLoginErrorCode(err as Error);
      setError(errorCode);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <BaseLayout
      header={null}
      main={
        <div
          id="login-page"
          data-testid="login-page-test-id"
          aria-label="login-page-aria-label"
          className={styles.page}
        >
          <div
            id="login-body"
            data-testid="login-body-test-id"
            aria-label="login-body-aria-label"
            className={styles.body}
          >
            <LoginForm
              onSubmit={handleLogin}
              isLoading={isLoggingIn}
              error={error}
            />
          </div>
        </div>
      }
    />
  );
};

export default LoginPage;
