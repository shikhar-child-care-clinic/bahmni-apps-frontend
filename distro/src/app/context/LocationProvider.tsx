import { getUserLoginLocation, getAvailableLocations } from '@bahmni/services';
import React, { useEffect, useMemo, useState } from 'react';
import { LocationContext, UserLocation } from './LocationContext';

interface LocationProviderProps {
  children: React.ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({
  children,
}) => {
  const [location, setLocationState] = useState<UserLocation | null>(null);
  const [availableLocations, setAvailableLocations] = useState<UserLocation[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeLocation = async () => {
      try {
        setError(null);
        const currentLocation = getUserLoginLocation();
        setLocationState(currentLocation);
        const locations = await getAvailableLocations();
        setAvailableLocations(locations);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load location';
        // eslint-disable-next-line no-console
        console.error('Location initialization error:', errorMessage);
        setError(errorMessage);
        setLocationState(null);
      } finally {
        setLoading(false);
      }
    };

    initializeLocation();
  }, []);

  const handleSetLocation = async (newLocation: UserLocation) => {
    try {
      setError(null);
      setLocationState(newLocation);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update location';
      setError(errorMessage);
      // eslint-disable-next-line no-console
      console.error('Error updating location:', err);
      throw err;
    }
  };

  const value = useMemo(
    () => ({
      location,
      setLocation: handleSetLocation,
      availableLocations,
      loading,
      error,
    }),
    [location, availableLocations, loading, error],
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
