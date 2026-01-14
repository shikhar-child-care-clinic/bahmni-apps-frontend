import { useContext } from 'react';
import { RegistrationConfigContext } from './context';
import { RegistrationConfigContextType } from './models';

/**
 * Custom hook to access the config context
 * @returns The config context values including config, loading state, and error
 */
export const useRegistrationConfig = (): RegistrationConfigContextType => {
  const context = useContext(RegistrationConfigContext);

  if (!context) {
    throw new Error(
      'useRegistrationConfig must be used within a RegistrationConfigProvider',
    );
  }

  return context;
};
