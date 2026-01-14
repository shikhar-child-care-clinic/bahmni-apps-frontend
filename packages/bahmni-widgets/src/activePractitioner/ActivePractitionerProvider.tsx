import {
  getCurrentProvider,
  getCurrentUser,
  Provider,
  User,
  getFormattedError,
} from '@bahmni/services';
import React, {
  ReactNode,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from 'react';
import { ActivePractitionerContext } from './ActivePractitionerContext';

interface ActivePractitionerProviderProps {
  children: ReactNode;
}

export const ActivePractitionerProvider: React.FC<
  ActivePractitionerProviderProps
> = ({ children }) => {
  const [practitioner, setPractitioner] = useState<Provider | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchActivePractitioner = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch current user
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new Error('ERROR_FETCHING_USER_DETAILS');
      }
      setUser(currentUser);

      // Fetch current provider
      const currentProvider = await getCurrentProvider(currentUser.uuid);
      if (!currentProvider) {
        throw new Error('ERROR_FETCHING_PRACTITIONERS_DETAILS');
      }
      setPractitioner(currentProvider);
      setError(null);
    } catch (err) {
      const { message } = getFormattedError(err);
      setError(err instanceof Error ? err : new Error(message));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivePractitioner();
  }, [fetchActivePractitioner]);

  const value = useMemo(
    () => ({
      practitioner,
      user,
      loading,
      error,
      refetch: fetchActivePractitioner,
    }),
    [practitioner, user, loading, error, fetchActivePractitioner],
  );

  return (
    <ActivePractitionerContext.Provider value={value}>
      {children}
    </ActivePractitionerContext.Provider>
  );
};

ActivePractitionerProvider.displayName = 'ActivePractitionerProvider';
