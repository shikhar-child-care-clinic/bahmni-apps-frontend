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
  getVaccinations,
  getPatientMedications,
  MedicationStatus,
  MedicationRequest,
  useSubscribeConsultationSaved,
  ConsultationSavedEventPayload,
} from '@bahmni/services';
import { usePatientUUID } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import React, {
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
} from 'react';

import useMedicationConfig from '../../../hooks/useMedicationConfig';
import { MedicationFilterResult } from '../../../models/medication';
import {
  getMedicationDisplay,
  getMedicationsFromBundle,
} from '../../../services/medicationService';
import { useVaccinationStore } from '../../../stores/vaccinationsStore';
import {
  calculateEndDate,
  doDateRangesOverlap,
  getBaseName,
} from '../../../utils/fhir/medicationUtilities';

import SelectedVaccinationItem from './SelectedVaccinationItem';
import styles from './styles/VaccinationForm.module.scss';

/**
 * VaccinationForm component
 *
 * Note: Vaccinations are always STAT (immediate, single-time administration).
 * Unlike medications, they don't support scheduled administration, so overlap
 * detection is simpler (string-based name matching is sufficient).
 */
const VaccinationForm: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const [searchVaccinationTerm, setSearchVaccinationTerm] = useState('');
  const [showDuplicateNotification, setShowDuplicateNotification] =
    useState(false);
  const isSelectingRef = useRef(false);
  const {
    medicationConfig,
    loading: medicationConfigLoading,
    error: medicationConfigError,
  } = useMedicationConfig();

  const {
    data: vaccinationsBundle,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['vaccinations'],
    queryFn: getVaccinations,
  });

  // Extract medications from bundle
  const searchResults = useMemo(
    () =>
      vaccinationsBundle ? getMedicationsFromBundle(vaccinationsBundle) : [],
    [vaccinationsBundle],
  );

  // Fetch existing vaccinations from backend using TanStack Query
  // Always fetch for STAT duplicate detection, even on new consultation
  const {
    data: existingVaccinations,
    isLoading: existingVaccinationsLoading,
    refetch: refetchVaccinations,
  } = useQuery({
    queryKey: ['patientVaccinations', patientUUID],
    enabled: !!patientUUID,
    queryFn: () => getPatientMedications(patientUUID!, [], undefined),
  });

  // Refetch existing vaccinations when a consultation is saved
  useSubscribeConsultationSaved(
    (payload: ConsultationSavedEventPayload) => {
      if (
        payload.patientUUID === patientUUID &&
        payload.updatedResources.medications
      ) {
        refetchVaccinations();
      }
    },
    [patientUUID, refetchVaccinations],
  );

  const activeVaccinations = useMemo(() => {
    if (!existingVaccinations || !Array.isArray(existingVaccinations)) {
      return [];
    }
    return existingVaccinations.filter(
      (vac: MedicationRequest) =>
        vac.status === MedicationStatus.Active ||
        vac.status === MedicationStatus.OnHold,
    );
  }, [existingVaccinations]);

  const {
    selectedVaccinations,
    addVaccination,
    removeVaccination,
    updateDosage,
    updateDosageUnit,
    updateFrequency,
    updateRoute,
    updateDuration,
    updateDurationUnit,
    updateInstruction,
    updateisSTAT,
    updateDispenseQuantity,
    updateDispenseUnit,
    updateStartDate,
    updateNote,
  } = useVaccinationStore();

  const isDuplicateVaccination = useCallback(
    (
      vaccinationDisplayName: string,
      newStartDate: Date,
      newDuration: number,
      newDurationUnit: string,
    ): boolean => {
      const effectiveDuration = newDuration > 0 ? newDuration : 7;
      const effectiveUnit = newDurationUnit ?? 'd';
      const newEndDate = calculateEndDate(
        newStartDate,
        effectiveDuration,
        effectiveUnit,
      );

      const newVaccinationBaseName = getBaseName(vaccinationDisplayName);

      const isExistingDuplicate = activeVaccinations.some(
        (vac: MedicationRequest) => {
          if (!vac.name) {
            return false;
          }

          const existingBaseName = getBaseName(vac.name);

          if (!existingBaseName || !newVaccinationBaseName) {
            return false;
          }

          if (existingBaseName !== newVaccinationBaseName) {
            return false;
          }

          if (vac.isImmediate) {
            return true;
          }

          if (!vac.startDate) {
            return false;
          }

          const existingDuration = vac.duration?.duration ?? 7;
          const existingDurationUnit = vac.duration?.durationUnit ?? 'd';

          const existingStartDate = new Date(vac.startDate);
          const existingEndDate = calculateEndDate(
            existingStartDate,
            existingDuration,
            existingDurationUnit,
          );

          return doDateRangesOverlap(
            existingStartDate,
            existingEndDate,
            newStartDate,
            newEndDate,
          );
        },
      );

      const isSelectedDuplicate = selectedVaccinations.some((selected) => {
        const selectedBaseName = getBaseName(selected.display);
        if (!selectedBaseName || !newVaccinationBaseName) {
          return false;
        }
        return selectedBaseName === newVaccinationBaseName;
      });

      return isExistingDuplicate || isSelectedDuplicate;
    },
    [activeVaccinations, selectedVaccinations],
  );

  /**
   * Check if there are any overlapping vaccinations among the currently selected vaccinations
   * and with existing vaccinations from the backend
   */
  const checkVaccinationsOverlap = useCallback((): boolean => {
    // Check overlaps between selected vaccinations
    for (let i = 0; i < selectedVaccinations.length; i++) {
      const current = selectedVaccinations[i];

      // Skip if current has no startDate (required for overlap check)
      if (!current.startDate) continue;

      // Check against other selected vaccinations
      for (let j = i + 1; j < selectedVaccinations.length; j++) {
        const other = selectedVaccinations[j];

        const currentBaseName = getBaseName(current.display);
        const otherBaseName = getBaseName(other.display);

        if (!currentBaseName || !otherBaseName) continue;
        if (currentBaseName !== otherBaseName) continue;

        // Same vaccination found - STAT always overlaps
        if (current.isSTAT || other.isSTAT) {
          return true;
        }

        // Both are scheduled - check date overlap
        if (!other.startDate) continue;

        const currentStart = new Date(current.startDate);
        const currentEnd = calculateEndDate(
          currentStart,
          current.duration,
          current.durationUnit?.code ?? 'd',
        );

        const otherStart = new Date(other.startDate);
        const otherEnd = calculateEndDate(
          otherStart,
          other.duration,
          other.durationUnit?.code ?? 'd',
        );

        if (
          doDateRangesOverlap(currentStart, currentEnd, otherStart, otherEnd)
        ) {
          return true;
        }
      }

      // Check against existing vaccinations
      const isExistingOverlap = activeVaccinations.some(
        (vac: MedicationRequest) => {
          if (!vac.name) return false;

          const currentBaseName = getBaseName(current.display);
          const existingBaseName = getBaseName(vac.name);

          if (!currentBaseName || !existingBaseName) return false;
          if (currentBaseName !== existingBaseName) return false;

          // STAT vaccinations always overlap with existing same vaccination
          if (vac.isImmediate || current.isSTAT) return true;

          if (!vac.startDate || !current.startDate) return false;

          const existingStart = new Date(vac.startDate);
          const existingDuration = vac.duration?.duration ?? 7;
          const existingDurationUnit = vac.duration?.durationUnit ?? 'd';
          const existingEnd = calculateEndDate(
            existingStart,
            existingDuration,
            existingDurationUnit,
          );

          const currentStart = new Date(current.startDate);
          const currentEnd = calculateEndDate(
            currentStart,
            current.duration,
            current.durationUnit?.code ?? 'd',
          );

          return doDateRangesOverlap(
            existingStart,
            existingEnd,
            currentStart,
            currentEnd,
          );
        },
      );

      if (isExistingOverlap) return true;
    }

    return false;
  }, [selectedVaccinations, activeVaccinations]);

  /**
   * Monitor selected vaccinations and update notification based on current overlap status
   * Shows notification when overlaps exist, hides when no overlaps detected
   */
  useEffect(() => {
    const hasOverlaps = checkVaccinationsOverlap();
    setShowDuplicateNotification(hasOverlaps);
  }, [checkVaccinationsOverlap]);

  const handleSearch = (searchTerm: string) => {
    // Only update search term if we're not in the process of selecting an item
    if (!isSelectingRef.current) {
      setSearchVaccinationTerm(searchTerm);
    }
  };

  const handleOnChange = (selectedItem: MedicationFilterResult) => {
    if (!selectedItem?.medication?.id) {
      return;
    }

    const displayName = getMedicationDisplay(selectedItem.medication);

    const newStartDate = new Date();
    const isDuplicate = isDuplicateVaccination(
      displayName,
      newStartDate,
      7,
      'd',
    );

    setShowDuplicateNotification(isDuplicate);

    isSelectingRef.current = true;
    addVaccination(selectedItem.medication, displayName);
    setSearchVaccinationTerm('');
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 100);
  };

  const filteredSearchResults = useMemo(() => {
    if (!searchVaccinationTerm || searchVaccinationTerm.trim() === '') {
      return [];
    }
    if (loading || existingVaccinationsLoading) {
      return [
        {
          displayName: t('LOADING_VACCINATIONS'),
          disabled: true,
        },
      ];
    }
    if (error) {
      return [
        {
          displayName: t('ERROR_SEARCHING_VACCINATIONS', {
            error: (error as Error).message,
          }),
          disabled: true,
        },
      ];
    }
    if (!searchResults || searchResults.length === 0) {
      return [
        {
          displayName: t('NO_MATCHING_VACCINATIONS_FOUND'),
          disabled: true,
        },
      ];
    }

    // Filter vaccines based on search term
    const filtered = searchResults.filter((item) => {
      const displayName = getMedicationDisplay(item).toLowerCase();
      return displayName.includes(searchVaccinationTerm.toLowerCase());
    });

    if (filtered.length === 0) {
      return [
        {
          displayName: t('NO_MATCHING_VACCINATIONS_FOUND'),
          disabled: true,
        },
      ];
    }

    return filtered.map((item) => {
      const itemDisplayName = getMedicationDisplay(item);
      const itemBaseName = getBaseName(itemDisplayName);

      const isAlreadySelected = selectedVaccinations.some((selected) => {
        const selectedBaseName = getBaseName(selected.display);
        return selectedBaseName === itemBaseName;
      });

      return {
        medication: item,
        displayName: isAlreadySelected
          ? `${itemDisplayName} (${t('VACCINATION_ALREADY_SELECTED')})`
          : itemDisplayName,
        disabled: isAlreadySelected,
      };
    });
  }, [
    searchVaccinationTerm,
    loading,
    existingVaccinationsLoading,
    error,
    searchResults,
    selectedVaccinations,
    t,
  ]);

  return (
    <Tile
      className={styles.vaccinationFormTile}
      data-testid="vaccination-form-tile"
    >
      <div
        className={styles.vaccinationFormTitle}
        data-testid="vaccination-form-title"
      >
        {t('VACCINATION_FORM_TITLE')}
      </div>
      {medicationConfigLoading && <DropdownSkeleton />}
      {medicationConfigError && (
        <div>
          {t('ERROR_FETCHING_VACCINATION_CONFIG', {
            error: medicationConfigError.message,
          })}
        </div>
      )}
      {!medicationConfigLoading && !medicationConfigError && (
        <ComboBox
          id="vaccinations-search"
          data-testid="vaccinations-search-combobox"
          placeholder={t('VACCINATION_SEARCH_PLACEHOLDER')}
          items={filteredSearchResults}
          itemToString={(item) => (item ? item.displayName : '')}
          onChange={(data) => handleOnChange(data.selectedItem!)}
          onInputChange={(searchQuery: string) => handleSearch(searchQuery)}
          size="md"
          autoAlign
          disabled={existingVaccinationsLoading}
          aria-label={t('VACCINATION_SEARCH_PLACEHOLDER')}
        />
      )}
      {showDuplicateNotification && (
        <InlineNotification
          kind="error"
          lowContrast
          subtitle={t('ERROR_DUPLICATE_ACTIVE_VACCINATION')}
          onClose={() => setShowDuplicateNotification(false)}
          hideCloseButton={false}
          className={styles.duplicateNotification}
        />
      )}
      {medicationConfig &&
        selectedVaccinations &&
        selectedVaccinations.length > 0 && (
          <BoxWHeader
            title={t('VACCINATION_ADDED_VACCINATIONS')}
            className={styles.vaccinationBox}
          >
            {selectedVaccinations.map((vaccination) => (
              <SelectedItem
                onClose={() => removeVaccination(vaccination.id)}
                className={styles.selectedVaccinationItem}
                key={vaccination.id}
              >
                <SelectedVaccinationItem
                  vaccinationInputEntry={vaccination}
                  medicationConfig={medicationConfig!}
                  updateDosage={updateDosage}
                  updateDosageUnit={updateDosageUnit}
                  updateFrequency={updateFrequency}
                  updateRoute={updateRoute}
                  updateDuration={updateDuration}
                  updateDurationUnit={updateDurationUnit}
                  updateInstruction={updateInstruction}
                  updateisSTAT={updateisSTAT}
                  updateDispenseQuantity={updateDispenseQuantity}
                  updateDispenseUnit={updateDispenseUnit}
                  updateStartDate={updateStartDate}
                  updateNote={updateNote}
                />
              </SelectedItem>
            ))}
          </BoxWHeader>
        )}
    </Tile>
  );
});

VaccinationForm.displayName = 'VaccinationForm';

export default VaccinationForm;
