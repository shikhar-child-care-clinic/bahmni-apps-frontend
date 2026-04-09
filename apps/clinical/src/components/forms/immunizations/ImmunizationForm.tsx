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
  searchFHIRConcepts,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { Coding } from 'fhir/r4';
import React, { useState, useMemo, useRef } from 'react';

import {
  ImmunizationConceptFilterResult,
  ImmunizationMode,
} from '../../../models/immunization';
import { useClinicalConfig } from '../../../providers/clinicalConfig';
import { useImmunizationStore } from '../../../stores/immunizationStore';
import { resolveFieldConfig } from '../../../utils/immunizationFieldConfig';

import SelectedImmunizationItem from './SelectedImmunizationItem';
import styles from './styles/ImmunizationForm.module.scss';

interface ImmunizationFormProps {
  mode: ImmunizationMode;
  titleKey: string;
  searchPlaceholderKey?: string;
  addedLabelKey?: string;
}

const extractConceptItems = (
  valueSet: { expansion?: { contains?: Coding[] } } | undefined,
): { uuid: string; name: string }[] => {
  if (!valueSet?.expansion?.contains) return [];
  return valueSet.expansion.contains
    .filter((c) => c.code && c.display)
    .map((c) => ({ uuid: c.code!, name: c.display! }));
};

const ImmunizationForm: React.FC<ImmunizationFormProps> = React.memo(
  ({
    mode,
    titleKey,
    searchPlaceholderKey = 'IMMUNIZATION_SEARCH_PLACEHOLDER',
    addedLabelKey = 'IMMUNIZATION_ADDED',
  }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const isSelectingRef = useRef(false);
    const [selectedItem] = useState<ImmunizationConceptFilterResult | null>(
      null,
    );

    const { clinicalConfig, isLoading: isConfigLoading } = useClinicalConfig();
    const immunizationFormConfig =
      clinicalConfig?.consultationPad?.immunizationForm;

    const modeConfig =
      clinicalConfig?.consultationPad?.immunizationForm?.[
        mode === 'not-done' ? 'notDone' : mode
      ];

    const fieldConfig = useMemo(
      () => resolveFieldConfig(mode, modeConfig?.fieldConfig),
      [mode, modeConfig],
    );

    const {
      data: vaccineConceptsValueSet,
      isLoading: conceptsLoading,
      error: conceptsError,
    } = useQuery({
      queryKey: [
        'vaccineConcepts',
        immunizationFormConfig?.vaccineConceptSetUuid,
      ],
      queryFn: () =>
        searchFHIRConcepts(immunizationFormConfig!.vaccineConceptSetUuid),
      enabled: !!immunizationFormConfig?.vaccineConceptSetUuid,
      staleTime: Infinity,
    });

    const { data: routeValueSet } = useQuery({
      queryKey: [
        'immunizationRoutes',
        immunizationFormConfig?.routeConceptSetUuid,
      ],
      queryFn: () =>
        searchFHIRConcepts(immunizationFormConfig!.routeConceptSetUuid),
      enabled: !!immunizationFormConfig?.routeConceptSetUuid,
      staleTime: Infinity,
    });

    const { data: siteValueSet } = useQuery({
      queryKey: [
        'immunizationSites',
        immunizationFormConfig?.siteConceptSetUuid,
      ],
      queryFn: () =>
        searchFHIRConcepts(immunizationFormConfig!.siteConceptSetUuid),
      enabled: !!immunizationFormConfig?.siteConceptSetUuid,
      staleTime: Infinity,
    });

    const { data: statusReasonValueSet } = useQuery({
      queryKey: [
        'immunizationStatusReasons',
        immunizationFormConfig?.notDoneStatusReasonConceptSetUuid,
      ],
      queryFn: () =>
        searchFHIRConcepts(
          immunizationFormConfig!.notDoneStatusReasonConceptSetUuid,
        ),
      enabled:
        !!immunizationFormConfig?.notDoneStatusReasonConceptSetUuid &&
        mode === 'not-done',
      staleTime: Infinity,
    });

    const vaccineConcepts = useMemo(
      () => extractConceptItems(vaccineConceptsValueSet),
      [vaccineConceptsValueSet],
    );

    const routeItems = useMemo(
      () => extractConceptItems(routeValueSet),
      [routeValueSet],
    );

    const siteItems = useMemo(
      () => extractConceptItems(siteValueSet),
      [siteValueSet],
    );

    const statusReasonItems = useMemo(
      () => extractConceptItems(statusReasonValueSet),
      [statusReasonValueSet],
    );

    const { data: vaccinationsBundle } = useQuery({
      queryKey: ['vaccinations'],
      queryFn: getVaccinations,
      staleTime: Infinity,
    });

    const {
      selectedImmunizations,
      addImmunization,
      removeImmunization,
      updateDoseSequence,
      updateDrug,
      updateDrugNonCoded,
      updateAdministeredOn,
      updateLocation,
      updateLocationText,
      updateRoute,
      updateSite,
      updateManufacturer,
      updateBatchNumber,
      updateExpirationDate,
      updateNotes,
      updateStatusReason,
    } = useImmunizationStore();

    const entriesForMode = useMemo(
      () => selectedImmunizations.filter((e) => e.mode === mode),
      [selectedImmunizations, mode],
    );

    const handleSearch = (term: string) => {
      if (!isSelectingRef.current) {
        setSearchTerm(term);
      }
    };

    const handleOnChange = (
      selected: ImmunizationConceptFilterResult | null,
    ) => {
      if (!selected?.concept) return;

      isSelectingRef.current = true;
      addImmunization(selected.concept.uuid, selected.concept.name, mode);
      setSearchTerm('');
      setTimeout(() => {
        isSelectingRef.current = false;
      }, 100);
    };

    const filteredSearchResults: ImmunizationConceptFilterResult[] =
      useMemo(() => {
        if (!searchTerm || searchTerm.trim() === '') return [];

        if (conceptsLoading) {
          return [
            { displayName: t('LOADING_VACCINE_CONCEPTS'), disabled: true },
          ];
        }

        if (conceptsError) {
          return [
            {
              displayName: t('ERROR_FETCHING_VACCINE_CONCEPTS', {
                error: (conceptsError as Error).message,
              }),
              disabled: true,
            },
          ];
        }

        if (!vaccineConcepts || vaccineConcepts.length === 0) {
          return [
            {
              displayName: t('NO_MATCHING_VACCINE_CONCEPTS_FOUND'),
              disabled: true,
            },
          ];
        }

        const filtered = vaccineConcepts.filter((concept) =>
          concept.name.toLowerCase().includes(searchTerm.toLowerCase()),
        );

        if (filtered.length === 0) {
          return [
            {
              displayName: t('NO_MATCHING_VACCINE_CONCEPTS_FOUND'),
              disabled: true,
            },
          ];
        }

        return filtered.map((concept) => ({
          concept,
          displayName: concept.name,
          disabled: false,
        }));
      }, [searchTerm, conceptsLoading, conceptsError, vaccineConcepts, t]);

    if (!isConfigLoading && !immunizationFormConfig) {
      return (
        <Tile
          className={styles.immunizationFormTile}
          data-testid={`immunization-form-tile-${mode}`}
        >
          <div className={styles.immunizationFormTitle}>{t(titleKey)}</div>
          <InlineNotification
            kind="error"
            lowContrast
            subtitle={t('IMMUNIZATION_CONFIG_MISSING')}
            hideCloseButton
          />
        </Tile>
      );
    }

    return (
      <Tile
        className={styles.immunizationFormTile}
        data-testid={`immunization-form-tile-${mode}`}
      >
        <div
          className={styles.immunizationFormTitle}
          data-testid={`immunization-form-title-${mode}`}
        >
          {t(titleKey)}
        </div>
        {isConfigLoading && <DropdownSkeleton />}
        {!isConfigLoading && (
          <ComboBox
            id={`immunization-search-${mode}`}
            data-testid={`immunization-search-combobox-${mode}`}
            placeholder={t(searchPlaceholderKey)}
            items={filteredSearchResults}
            itemToString={(item) => item?.displayName ?? ''}
            onChange={({ selectedItem }) => handleOnChange(selectedItem ?? null)}
            onInputChange={(query: string) => handleSearch(query)}
            selectedItem={selectedItem}
            clearSelectedOnChange
            allowCustomValue
            size="md"
            autoAlign
            aria-label={t(searchPlaceholderKey)}
          />
        )}
        {vaccinationsBundle && entriesForMode.length > 0 && (
          <BoxWHeader
            title={t(addedLabelKey)}
            className={styles.immunizationBox}
          >
            {entriesForMode.map((entry) => (
              <SelectedItem
                onClose={() => removeImmunization(entry.id)}
                className={styles.selectedImmunizationItem}
                key={entry.id}
              >
                <SelectedImmunizationItem
                  entry={entry}
                  fieldConfig={fieldConfig}
                  vaccineConceptUuid={entry.vaccineConceptUuid}
                  vaccinationsBundle={vaccinationsBundle}
                  routeItems={routeItems}
                  siteItems={siteItems}
                  statusReasonItems={statusReasonItems}
                  updateDoseSequence={updateDoseSequence}
                  updateDrug={updateDrug}
                  updateDrugNonCoded={updateDrugNonCoded}
                  updateAdministeredOn={updateAdministeredOn}
                  updateLocation={updateLocation}
                  updateLocationText={updateLocationText}
                  updateRoute={updateRoute}
                  updateSite={updateSite}
                  updateManufacturer={updateManufacturer}
                  updateBatchNumber={updateBatchNumber}
                  updateExpirationDate={updateExpirationDate}
                  updateNotes={updateNotes}
                  updateStatusReason={updateStatusReason}
                />
              </SelectedItem>
            ))}
          </BoxWHeader>
        )}
      </Tile>
    );
  },
);

ImmunizationForm.displayName = 'ImmunizationForm';

export default ImmunizationForm;
