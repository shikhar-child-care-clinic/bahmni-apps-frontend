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
 * Extract base medication name for comparison
 * Handles two formats:
 * 1. Search display: "Drug Name (Form)- Code Name" → extracts "Code Name"
 * 2. Backend name: "Code Name" (e.g., "Albendazole 400 mg")
 *
 * Returns lowercase normalized name for comparison
 */
const getBaseMedicationName = (fullName: string): string => {
  // Check for search display format: "Drug Name (Form)- Code Name"
  // Note: The hyphen may or may not have spaces around it
  const hyphenMatch = fullName.match(/\)\s*-\s*(.+)$/);
  if (hyphenMatch) {
    // Extract the code name part after the hyphen
    return hyphenMatch[1].trim().toLowerCase();
  }

  // For backend format, just normalize and return
  // Remove any trailing/leading whitespace and lowercase
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
    return existingMedications.filter(
      (med: MedicationRequest) =>
        med.status === MedicationStatus.Active ||
        med.status === MedicationStatus.OnHold,
    );
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

      // Check against existing active/scheduled medications from backend
      const isExistingDuplicate = activeMedications.some(
        (med: MedicationRequest) => {
          const existingBaseName = getBaseMedicationName(med.name);

          // Check if same medication by comparing base names
          if (existingBaseName !== newMedicationBaseName) {
            return false;
          }

          // Get duration from MedicationRequest
          // STAT (immediate) medications have no duration - use 1 day
          // Regular medications without duration default to 7 days
          const existingDuration =
            med.duration?.duration ?? (med.isImmediate ? 1 : 7);
          const existingDurationUnit = med.duration?.durationUnit ?? 'd';

          const existingStartDate = new Date(med.startDate);
          const existingEndDate = calculateEndDate(
            existingStartDate,
            existingDuration,
            existingDurationUnit,
          );

          // Check date overlap
          return doDateRangesOverlap(
            existingStartDate,
            existingEndDate,
            newStartDate,
            newEndDate,
          );
        },
      );

      // Check against currently selected medications in the form (by ID)
      const isSelectedDuplicate = selectedMedications.some(
        (selected: MedicationInputEntry) => selected.id === medicationId,
      );

      return isExistingDuplicate || isSelectedDuplicate;
    },
    [activeMedications, selectedMedications],
  );

  // Clear notification when search term is cleared
  useEffect(() => {
    if (showDuplicateNotification && searchMedicationTerm === '') {
      setShowDuplicateNotification(false);
    }
  }, [searchMedicationTerm, showDuplicateNotification]);

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

    if (isDuplicate) {
      setShowDuplicateNotification(true);
      return; // Don't add duplicate
    }

    // Successfully added, clear any previous duplicate notification
    setShowDuplicateNotification(false);

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
      // Check if this medication is already selected
      const isAlreadySelected = selectedMedications.some(
        (selected) => selected.id === item.id,
      );

      return {
        medication: item,
        displayName: isAlreadySelected
          ? `${getMedicationDisplay(item)} (${t('MEDICATIONS_ALREADY_ADDED')})`
          : getMedicationDisplay(item),
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
    <Tile className={styles.medicationsFormTile}>
      <div className={styles.medicationsFormTitle}>
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
