import { Loading } from '@bahmni/design-system';
import { getConfig, useTranslation } from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import React, { ReactNode, useMemo, useEffect } from 'react';
import { REGISTRATION_CONFIG_URL } from './constants';
import { RegistrationConfigContext } from './context';
import { RegistrationConfig } from './models';
import registrationConfigSchema from './schema.json';

interface RegistrationConfigProviderProps {
  children: ReactNode;
}

export const RegistrationConfigProvider: React.FC<
  RegistrationConfigProviderProps
> = ({ children }) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();

  const {
    data: registrationConfig,
    isLoading: isLoading,
    error,
  } = useQuery({
    queryKey: ['registrationConfig'],
    queryFn: () =>
      getConfig<RegistrationConfig>(
        REGISTRATION_CONFIG_URL,
        registrationConfigSchema,
      ),
  });

  const value = useMemo(
    () => ({
      registrationConfig,
      isLoading,
      error,
    }),
    [registrationConfig, isLoading, error],
  );

  useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        title: t('ERROR_CONFIG_TITLE'),
        message: error.message,
      });
    }
  }, [error]);

  if (error) {
    return (
      <div
        id="registration-config-error"
        data-testid="registration-config-error-test-id"
      />
    );
  }

  if (isLoading) {
    return (
      <Loading
        id="registration-config-loader"
        testId="registration-config-loader-test-id"
        role="status"
      />
    );
  }

  return (
    <RegistrationConfigContext.Provider value={value}>
      {children}
    </RegistrationConfigContext.Provider>
  );
};

RegistrationConfigProvider.displayName = 'RegistrationConfigProvider';
