import { Loading } from '@bahmni/design-system';
import { getConfig, useTranslation } from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import React, { ReactNode, useMemo, useEffect } from 'react';
import { CLINICAL_CONFIG_URL } from './constants';
import { ClinicalConfigContext } from './context';
import { ClinicalConfig } from './models';
import clinicalConfigSchema from './schema.json';

interface ClinicalConfigProviderProps {
  children: ReactNode;
}

export const ClinicalConfigProvider: React.FC<ClinicalConfigProviderProps> = ({
  children,
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();

  const {
    data: clinicalConfig,
    isLoading: isLoading,
    error,
  } = useQuery({
    queryKey: ['clinicConfig'],
    queryFn: () =>
      getConfig<ClinicalConfig>(CLINICAL_CONFIG_URL, clinicalConfigSchema),
  });

  const value = useMemo(
    () => ({
      clinicalConfig,
      isLoading,
      error,
    }),
    [clinicalConfig, isLoading, error],
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
        id="clinical-config-error"
        data-testid="clinical-config-error-test-id"
      />
    );
  }

  if (isLoading) {
    return (
      <Loading
        id="clinical-config-loader"
        testId="clinical-config-loader-test-id"
        role="status"
      />
    );
  }

  return (
    <ClinicalConfigContext.Provider value={value}>
      {children}
    </ClinicalConfigContext.Provider>
  );
};

ClinicalConfigProvider.displayName = 'ClinicalConfigProvider';
