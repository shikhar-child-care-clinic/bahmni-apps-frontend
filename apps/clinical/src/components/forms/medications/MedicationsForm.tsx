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
  getPatientMedicationBundle,
  useSubscribeConsultationSaved,
  ConsultationSavedEventPayload,
} from '@bahmni/services';
import { useNotification, usePatientUUID } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import {
  Bundle,
  Medication,
  MedicationRequest as FhirMedicationRequest,
} from 'fhir/r4';
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
import {
  calculateEndDate,
  doDateRangesOverlap,
  getBaseName,
  medicationsMatchByCode,
} from '../../../utils/fhir/medicationUtilities';
import SelectedMedicationItem from './SelectedMedicationItem';
import styles from './styles/MedicationsForm.module.scss';

/**
 * Safely extract medication ID from FHIR medicationReference
 * Returns undefined if reference is malformed or missing
 */
const extractMedicationRefId = (
  reference: string | undefined,
): string | undefined => {
  if (!reference) return undefined;
  const parts = reference.split('/');
  // Expected format: "Medication/123" - need exactly 2 parts
  if (parts.length !== 2 || !parts[1]) return undefined;
  return parts[1];
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
  // Note: Cache invalidation is handled by consultation submission, not add/remove operations.
  // Add/remove only update the local Zustand store, not server state.
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
  // Use includeRelated=true to get full Medication details via _include parameter
  // This returns a Bundle with both MedicationRequest and Medication resources
  const {
    data: medicationBundle,
    isLoading: existingMedicationsLoading,
    error: existingMedicationsError,
    refetch: refetchMedications,
  } = useQuery<Bundle>({
    queryKey: ['medications', patientUUID!],
    enabled: !!patientUUID,
    queryFn: () =>
      getPatientMedicationBundle(patientUUID!, [], undefined, true),
    refetchOnMount: 'always',
  });

  // Refetch existing medications when a consultation is saved
  useSubscribeConsultationSaved(
    (payload: ConsultationSavedEventPayload) => {
      if (
        payload.patientUUID === patientUUID &&
        payload.updatedResources.medications
      ) {
        refetchMedications();
      }
    },
    [patientUUID, refetchMedications],
  );

  // Extract MedicationRequest entries and build Medication map from Bundle
  const { activeMedications, medicationMap } = useMemo(() => {
    if (!medicationBundle) return { activeMedications: [], medicationMap: {} };

    const requests: FhirMedicationRequest[] = [];
    const medications: Record<string, Medication> = {};

    // Bundle.entry contains both MedicationRequest and Medication resources
    if (medicationBundle.entry && Array.isArray(medicationBundle.entry)) {
      medicationBundle.entry.forEach((entry) => {
        if (!entry?.resource) return;

        if (entry.resource.resourceType === 'MedicationRequest') {
          const med = entry.resource as FhirMedicationRequest;
          const status = med.status?.toLowerCase();
          // Include active and on-hold medications
          if (status === 'active' || status === 'on-hold') {
            requests.push(med);
          }
        } else if (entry.resource.resourceType === 'Medication') {
          // Store Medication by its ID for lookup via medicationReference
          medications[entry.resource.id!] = entry.resource;
        }
      });
    }

    return { activeMedications: requests, medicationMap: medications };
  }, [medicationBundle]);

  useEffect(() => {
    if (existingMedicationsError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: existingMedicationsError.message,
        type: 'error',
      });
    }
  }, [existingMedicationsError, addNotification, t]);

  /**
   * Check if there are any overlapping medications among the currently selected medications
   * and with existing medications from the backend
   */
  const checkMedicationsOverlap = useCallback((): boolean => {
    // Check overlaps between selected medications
    for (let i = 0; i < selectedMedications.length; i++) {
      const current = selectedMedications[i];

      // Skip if current has no startDate (required for overlap check)
      if (!current.startDate) continue;

      // Check against other selected medications
      for (let j = i + 1; j < selectedMedications.length; j++) {
        const other = selectedMedications[j];

        if (!medicationsMatchByCode(current.medication, other.medication)) {
          continue;
        }

        // Same medication found - determine overlap based on type
        // STAT medications always overlap with same medication
        if (current.isSTAT || other.isSTAT) {
          return true;
        }

        // PRN medications don't overlap with scheduled or other PRN
        if (current.isPRN || other.isPRN) {
          continue;
        }

        // Both are scheduled - check date overlap
        if (!other.startDate) continue;

        const currentStart = new Date(current.startDate);
        const currentEnd = calculateEndDate(
          currentStart,
          current.duration > 0 ? current.duration : 1,
          current.durationUnit?.code ?? 'd',
        );

        const otherStart = new Date(other.startDate);
        const otherEnd = calculateEndDate(
          otherStart,
          other.duration > 0 ? other.duration : 1,
          other.durationUnit?.code ?? 'd',
        );

        if (
          doDateRangesOverlap(currentStart, currentEnd, otherStart, otherEnd)
        ) {
          return true;
        }
      }

      // Check against existing medications
      const isExistingOverlap = activeMedications.some(
        (med: FhirMedicationRequest) => {
          // Resolve medicationReference to get the Medication resource with codes
          const refId = extractMedicationRefId(
            med.medicationReference?.reference,
          );
          const medicationResource = refId ? medicationMap[refId] : null;

          // Compare using FHIR codes
          if (
            !medicationResource ||
            !medicationsMatchByCode(current.medication, medicationResource)
          ) {
            return false;
          }

          // Extract properties from FHIR MedicationRequest
          const isImmediate = med.priority === 'stat';
          const isPRN = med.dosageInstruction?.[0]?.asNeededBoolean ?? false;
          const startDate =
            med.dosageInstruction?.[0]?.timing?.event?.[0] ?? med.authoredOn;
          const duration =
            med.dosageInstruction?.[0]?.timing?.repeat?.duration ?? 7;
          const durationUnit =
            med.dosageInstruction?.[0]?.timing?.repeat?.durationUnit ?? 'd';

          // STAT medications always overlap with existing
          if (isImmediate || current.isSTAT) return true;

          // PRN medications don't cause overlaps with schedule-based
          if (isPRN || current.isPRN) return false;

          if (!startDate || !current.startDate) return false;

          const existingStart = new Date(startDate);
          const existingEnd = calculateEndDate(
            existingStart,
            duration,
            durationUnit,
          );

          const currentStart = new Date(current.startDate);
          const currentEnd = calculateEndDate(
            currentStart,
            current.duration > 0 ? current.duration : 1,
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
  }, [selectedMedications, activeMedications, medicationMap]);

  /**
   * Monitor selected medications and update notification based on current overlap status
   * Shows notification when overlaps exist, hides when no overlaps detected
   */
  useEffect(() => {
    const hasOverlaps = checkMedicationsOverlap();
    setShowDuplicateNotification(hasOverlaps);
  }, [checkMedicationsOverlap]);

  /**
   * Check if a medication is a duplicate based on:
   * 1. Same medication code (SNOMED preferred, with fallback to base name) AND
   * 2. Overlapping date ranges (for active/scheduled medications)
   */
  const isDuplicateMedication = useCallback(
    (
      medicationDisplayName: string,
      newMedication: Medication,
      newStartDate: Date,
      newDuration: number,
      newDurationUnit: string,
    ): boolean => {
      // Calculate new medication's date range (default 7 days if no duration)
      const effectiveDuration = newDuration > 0 ? newDuration : 1;
      const effectiveUnit = newDurationUnit ?? 'd';
      const newEndDate = calculateEndDate(
        newStartDate,
        effectiveDuration,
        effectiveUnit,
      );

      const isExistingDuplicate = activeMedications.some(
        (med: FhirMedicationRequest) => {
          // Resolve medicationReference to get the Medication resource with codes
          const refId = extractMedicationRefId(
            med.medicationReference?.reference,
          );
          const medicationResource = refId ? medicationMap[refId] : null;

          // Compare using FHIR codes - returns false if either has no codes
          if (
            !medicationResource ||
            !medicationsMatchByCode(newMedication, medicationResource)
          ) {
            return false;
          }

          // Extract properties from FHIR MedicationRequest
          const isImmediate = med.priority === 'stat';
          const startDate =
            med.dosageInstruction?.[0]?.timing?.event?.[0] ?? med.authoredOn;

          if (isImmediate) {
            return true;
          }

          if (!startDate) {
            return false;
          }

          const existingDuration =
            med.dosageInstruction?.[0]?.timing?.repeat?.duration ?? 7;
          const existingDurationUnit =
            med.dosageInstruction?.[0]?.timing?.repeat?.durationUnit ?? 'd';

          const existingStartDate = new Date(startDate);
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
          return medicationsMatchByCode(newMedication, selected.medication);
        },
      );

      return isExistingDuplicate || isSelectedDuplicate;
    },
    [activeMedications, selectedMedications, medicationMap],
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

    const newStartDate = new Date();
    const isDuplicate = isDuplicateMedication(
      displayName,
      selectedItem.medication,
      newStartDate,
      7,
      'd',
    );

    setShowDuplicateNotification(isDuplicate);

    isSelectingRef.current = true;
    addMedication(selectedItem.medication, displayName);

    setSearchMedicationTerm('');
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
      const itemBaseName = getBaseName(itemDisplayName);
      // Check if this medication is already selected (by base name, not ID)
      // This catches different concentrations of the same medication
      const isAlreadySelected = selectedMedications.some((selected) => {
        const selectedBaseName = getBaseName(selected.display);
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
          disabled={existingMedicationsLoading}
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
