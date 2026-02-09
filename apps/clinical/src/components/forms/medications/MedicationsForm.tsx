import {
  BoxWHeader,
  SelectedItem,
  ComboBox,
  DropdownSkeleton,
  Tile,
  InlineNotification,
} from '@bahmni/design-system';
import {
  useTranslation,
  getPatientMedications,
  MedicationRequest,
  MedicationStatus,
} from '@bahmni/services';
import { useNotification, usePatientUUID } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import { addDays } from 'date-fns';
import React, {
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import useMedicationConfig from '../../../hooks/useMedicationConfig';
import { useMedicationSearch } from '../../../hooks/useMedicationSearch';
import {
  MedicationFilterResult,
  MedicationInputEntry,
} from '../../../models/medication';
import { getMedicationDisplay } from '../../../services/medicationService';
import { useMedicationStore } from '../../../stores/medicationsStore';
import SelectedMedicationItem from './SelectedMedicationItem';
import styles from './styles/MedicationsForm.module.scss';

// Duration unit to days multiplier mapping
const DURATION_UNIT_TO_DAYS: Record<string, number> = {
  d: 1,
  wk: 7,
  mo: 30,
  a: 365,
  h: 1 / 24,
  min: 1 / 1440,
  s: 1 / 86400,
};

/**
 * Calculate end date from start date and duration
 */
const calculateEndDate = (
  startDate: Date | string,
  duration: number,
  durationUnit: string,
): Date => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const daysMultiplier = DURATION_UNIT_TO_DAYS[durationUnit] ?? 1;
  const totalDays = duration * daysMultiplier;
  return addDays(start, totalDays);
};

/**
 * Check if two date ranges overlap
 */
const doDateRangesOverlap = (
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): boolean => {
  return start1 <= end2 && start2 <= end1;
};

/**
 * Extract base medication name for comparison (ignores concentration/dosage)
 * Example: "Vitamin A 5000 IU" → "vitamin a"
 */
const getBaseMedicationName = (fullName: string): string => {
  // Handle null/undefined/non-string values
  if (!fullName || typeof fullName !== 'string') {
    return '';
  }

  // Check for display format with ")- " separator
  const separatorMatch = fullName.match(/\)-\s*(.+)$/);
  if (separatorMatch) {
    return separatorMatch[1].trim().toLowerCase();
  }

  // Fallback: Extract name before parentheses
  const parenthesesMatch = fullName.match(/^(.+?)\s*\(/);
  if (parenthesesMatch) {
    const nameBeforeParens = parenthesesMatch[1].trim();
    const baseNameMatch = nameBeforeParens.match(
      /^([A-Za-z0-9-\s]+?)(?:\s+\d+.*)?$/,
    );
    if (baseNameMatch) {
      return baseNameMatch[1].trim().toLowerCase();
    }
    return nameBeforeParens.toLowerCase();
  }

  // If no parentheses, remove trailing numbers
  const baseNameMatch = fullName.match(/^([A-Za-z0-9-\s]+?)(?:\s+\d+.*)?$/);
  if (baseNameMatch) {
    return baseNameMatch[1].trim().toLowerCase();
  }

  return fullName.trim().toLowerCase();
};

/**
 * MedicationsForm component
 *
 * A component that displays a search interface for medications and a list of selected medications.
 * It allows users to search for medications, select them, and specify dosage, frequency, route, timing, and duration.
 */
const MedicationsForm: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const { addNotification } = useNotification();
  const [searchMedicationTerm, setSearchMedicationTerm] = useState('');
  const [showDuplicateNotification, setShowDuplicateNotification] =
    useState(false);
  const isSelectingRef = useRef(false);
  const {
    medicationConfig,
    loading: medicationConfigLoading,
    error: medicationConfigError,
  } = useMedicationConfig();
  const { searchResults, loading, error } =
    useMedicationSearch(searchMedicationTerm);

  // Use Zustand store
  const {
    selectedMedications,
    addMedication,
    removeMedication,
    updateDosage,
    updateDosageUnit,
    updateFrequency,
    updateRoute,
    updateDuration,
    updateDurationUnit,
    updateInstruction,
    updateisPRN,
    updateisSTAT,
    updateDispenseQuantity,
    updateDispenseUnit,
    updateNote,
    updateStartDate,
  } = useMedicationStore();

  // Fetch existing medications from backend using TanStack Query
  const {
    data: existingMedications,
    isLoading: existingMedicationsLoading,
    error: existingMedicationsError,
  } = useQuery({
    queryKey: ['medications', patientUUID!, [], undefined],
    enabled: !!patientUUID,
    queryFn: () => getPatientMedications(patientUUID!, [], undefined),
  });

  useEffect(() => {
    if (existingMedicationsError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: existingMedicationsError.message,
        type: 'error',
      });
    }
  }, [existingMedicationsError, addNotification, t]);

  // Filter to only active/scheduled medications
  const activeMedications = useMemo(() => {
    if (!existingMedications) return [];
    const filtered = existingMedications.filter(
      (med: MedicationRequest) =>
        med.status === MedicationStatus.Active ||
        med.status === MedicationStatus.OnHold,
    );
    return filtered;
  }, [existingMedications]);

  /**
   * Check if a medication is a duplicate based on:
   * 1. Same medication name AND
   * 2. Overlapping date ranges (for active/scheduled medications)
   */
  const isDuplicateMedication = useCallback(
    (
      medicationId: string,
      medicationDisplayName: string,
      newStartDate: Date,
      newDuration: number,
      newDurationUnit: string,
    ): boolean => {
      // Calculate new medication's date range (default 7 days if no duration)
      const effectiveDuration = newDuration > 0 ? newDuration : 7;
      const effectiveUnit = newDurationUnit ?? 'd';
      const newEndDate = calculateEndDate(
        newStartDate,
        effectiveDuration,
        effectiveUnit,
      );

      const newMedicationBaseName = getBaseMedicationName(
        medicationDisplayName,
      );

      const isExistingDuplicate = activeMedications.some(
        (med: MedicationRequest) => {
          if (!med.name) {
            return false;
          }

          const existingBaseName = getBaseMedicationName(med.name);

          if (!existingBaseName || !newMedicationBaseName) {
            return false;
          }

          if (existingBaseName !== newMedicationBaseName) {
            return false;
          }

          if (med.isImmediate) {
            return true;
          }

          if (!med.startDate) {
            return false;
          }

          const existingDuration = med.duration?.duration ?? 7;
          const existingDurationUnit = med.duration?.durationUnit ?? 'd';

          const existingStartDate = new Date(med.startDate);
          const existingEndDate = calculateEndDate(
            existingStartDate,
            existingDuration,
            existingDurationUnit,
          );

          const overlaps = doDateRangesOverlap(
            existingStartDate,
            existingEndDate,
            newStartDate,
            newEndDate,
          );

          return overlaps;
        },
      );

      const isSelectedDuplicate = selectedMedications.some(
        (selected: MedicationInputEntry) => {
          const selectedBaseName = getBaseMedicationName(selected.display);
          if (!selectedBaseName || !newMedicationBaseName) {
            return false;
          }
          return selectedBaseName === newMedicationBaseName;
        },
      );

      return isExistingDuplicate || isSelectedDuplicate;
    },
    [activeMedications, selectedMedications],
  );

  const handleSearch = (searchTerm: string) => {
    // Only update search term if we're not in the process of selecting an item
    if (!isSelectingRef.current) {
      setSearchMedicationTerm(searchTerm);
    }
  };

  const handleOnChange = (selectedItem: MedicationFilterResult) => {
    if (!selectedItem?.medication?.id) {
      return;
    }

    const displayName = getMedicationDisplay(selectedItem.medication);

    // Check for duplicate with date overlap
    // New medications start today with default 7 day duration
    const newStartDate = new Date();
    const isDuplicate = isDuplicateMedication(
      selectedItem.medication.id,
      displayName,
      newStartDate,
      7,
      'd',
    );

    // Show notification if duplicate, but still allow adding
    setShowDuplicateNotification(isDuplicate);

    // Set flag to prevent search when ComboBox updates its input
    isSelectingRef.current = true;
    addMedication(selectedItem.medication, displayName);
    // Clear the search term after selection
    setSearchMedicationTerm('');
    // Reset the flag after a short delay to allow ComboBox to update
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 100);
  };

  const filteredSearchResults = useMemo(() => {
    if (!searchMedicationTerm || searchMedicationTerm.trim() === '') {
      return [];
    }
    if (loading || existingMedicationsLoading) {
      return [
        {
          displayName: t('LOADING_MEDICATIONS'),
          disabled: true,
        },
      ];
    }
    if (error) {
      return [
        {
          displayName: t('ERROR_SEARCHING_MEDICATIONS', {
            error: error.message,
          }),
          disabled: true,
        },
      ];
    }
    if (!searchResults || searchResults.length === 0) {
      return [
        {
          displayName: t('NO_MATCHING_MEDICATIONS_FOUND'),
          disabled: true,
        },
      ];
    }

    return searchResults.map((item) => {
      const itemDisplayName = getMedicationDisplay(item);
      const itemBaseName = getBaseMedicationName(itemDisplayName);
      // Check if this medication is already selected (by base name, not ID)
      // This catches different concentrations of the same medication
      const isAlreadySelected = selectedMedications.some((selected) => {
        const selectedBaseName = getBaseMedicationName(selected.display);
        return selectedBaseName === itemBaseName;
      });

      return {
        medication: item,
        displayName: isAlreadySelected
          ? `${itemDisplayName} (${t('MEDICATIONS_ALREADY_ADDED')})`
          : itemDisplayName,
        disabled: isAlreadySelected,
      };
    });
  }, [
    searchMedicationTerm,
    loading,
    existingMedicationsLoading,
    error,
    searchResults,
    selectedMedications,
    t,
  ]);

  return (
    <Tile
      className={styles.medicationsFormTile}
      data-testid="medications-form-tile"
    >
      <div
        className={styles.medicationsFormTitle}
        data-testid="medications-form-title"
      >
        {t('MEDICATIONS_FORM_TITLE')}
      </div>
      {medicationConfigLoading && <DropdownSkeleton />}
      {medicationConfigError && (
        <div>
          {t('ERROR_FETCHING_MEDICATION_CONFIG', {
            error: medicationConfigError.message,
          })}
        </div>
      )}
      {!medicationConfigLoading && !medicationConfigError && (
        <ComboBox
          id="medications-search"
          data-testid="medications-search-combobox"
          placeholder={t('MEDICATIONS_SEARCH_PLACEHOLDER')}
          items={filteredSearchResults}
          itemToString={(item) => (item ? item.displayName : '')}
          onChange={(data) => handleOnChange(data.selectedItem!)}
          onInputChange={(searchQuery: string) => handleSearch(searchQuery)}
          size="md"
          autoAlign
          aria-label={t('MEDICATIONS_SEARCH_PLACEHOLDER')}
        />
      )}
      {showDuplicateNotification && (
        <InlineNotification
          kind="error"
          lowContrast
          subtitle={t('ERROR_DUPLICATE_ACTIVE_MEDICATION')}
          onClose={() => setShowDuplicateNotification(false)}
          hideCloseButton={false}
          className={styles.duplicateNotification}
        />
      )}
      {medicationConfig &&
        selectedMedications &&
        selectedMedications.length > 0 && (
          <BoxWHeader
            title={t('MEDICATIONS_ADDED_MEDICATIONS')}
            className={styles.medicationsBox}
          >
            {selectedMedications.map((medication) => (
              <SelectedItem
                onClose={() => removeMedication(medication.id)}
                className={styles.selectedMedicationItem}
                key={medication.id}
              >
                <SelectedMedicationItem
                  medicationInputEntry={medication}
                  medicationConfig={medicationConfig!}
                  updateDosage={updateDosage}
                  updateDosageUnit={updateDosageUnit}
                  updateFrequency={updateFrequency}
                  updateRoute={updateRoute}
                  updateDuration={updateDuration}
                  updateDurationUnit={updateDurationUnit}
                  updateInstruction={updateInstruction}
                  updateisPRN={updateisPRN}
                  updateisSTAT={updateisSTAT}
                  updateDispenseQuantity={updateDispenseQuantity}
                  updateDispenseUnit={updateDispenseUnit}
                  updateNote={updateNote}
                  updateStartDate={updateStartDate}
                />
              </SelectedItem>
            ))}
          </BoxWHeader>
        )}
    </Tile>
  );
});

MedicationsForm.displayName = 'MedicationsForm';

export default MedicationsForm;
