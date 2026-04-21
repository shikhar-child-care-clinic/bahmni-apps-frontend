import { Dropdown } from '@bahmni/design-system';
import { useTranslation, UserLocation } from '@bahmni/services';
import React, { useState } from 'react';
import { useLocation } from '../../context/LocationContext';
import styles from './styles/LocationSelector.module.scss';

export const LocationSelector: React.FC = () => {
  const { t } = useTranslation();
  const { location, setLocation, availableLocations, loading, error } =
    useLocation();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLocationChange = async (selected: UserLocation) => {
    if (!selected || selected.uuid === location?.uuid) {
      return; // No change
    }

    try {
      setIsUpdating(true);
      await setLocation(selected);
    } catch (err) {
      // Error already set in context
      // eslint-disable-next-line no-console
      console.error('Failed to change location:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className={styles.loading} data-testid="location-loading">
        {t('LOADING')}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={styles.error} data-testid="location-error">
        {error}
      </div>
    );
  }

  // Show when no location selected
  if (!location) {
    return (
      <div className={styles.noLocation} data-testid="location-no-selection">
        {t('NO_LOCATION_SELECTED')}
      </div>
    );
  }

  const selectedItem =
    availableLocations.find((loc) => loc.uuid === location.uuid) ?? null;

  return (
    <Dropdown
      id="location-selector"
      titleText=""
      hideLabel
      label={location.name}
      items={availableLocations}
      itemToString={(item: UserLocation) => item?.display ?? item?.name ?? ''}
      selectedItem={selectedItem}
      onChange={({ selectedItem }: { selectedItem: UserLocation }) =>
        handleLocationChange(selectedItem)
      }
      disabled={isUpdating}
      size="sm"
      data-testid="location-selector"
    />
  );
};
