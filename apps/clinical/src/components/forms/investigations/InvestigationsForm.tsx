import {
  ComboBox,
  Tile,
  BoxWHeader,
  SelectedItem,
  InlineNotification,
} from '@bahmni/design-system';
import {
  useTranslation,
  getServiceRequests,
  getCategoryUuidFromOrderTypes,
  getOrderTypeNames,
} from '@bahmni/services';
import { usePatientUUID, useActivePractitioner } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useEncounterSession } from '../../../hooks/useEncounterSession';
import useInvestigationsSearch from '../../../hooks/useInvestigationsSearch';
import type { FlattenedInvestigations } from '../../../models/investigations';
import useServiceRequestStore from '../../../stores/serviceRequestStore';
import SelectedInvestigationItem from './SelectedInvestigationItem';
import styles from './styles/InvestigationsForm.module.scss';

const InvestigationsForm: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const { practitioner } = useActivePractitioner();
  const { activeEncounter } = useEncounterSession({ practitioner });

  const currentEncounterId = activeEncounter?.id;
  const currentPractitionerUuid = practitioner?.uuid;

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showDuplicateNotification, setShowDuplicateNotification] =
    useState(false);
  const [duplicateInvestigationId, setDuplicateInvestigationId] = useState<
    string | null
  >(null);
  const [duplicateCategory, setDuplicateCategory] = useState<string | null>(
    null,
  );
  const [duplicateCategoryCode, setDuplicateCategoryCode] = useState<
    string | null
  >(null);

  const { investigations, isLoading, error } =
    useInvestigationsSearch(searchTerm);
  const {
    selectedServiceRequests,
    addServiceRequest,
    updatePriority,
    updateNote,
    removeServiceRequest,
    isSelectedInCategory,
  } = useServiceRequestStore();

  const { data: existingServiceRequests } = useQuery({
    queryKey: ['existingServiceRequests', patientUUID, currentEncounterId],
    queryFn: async () => {
      const categories = await getOrderTypeNames();
      const results: Array<{
        conceptCode: string;
        categoryUuid: string;
        display: string;
        requesterUuid: string;
      }> = [];

      const encounterUuids = currentEncounterId
        ? [currentEncounterId]
        : undefined;

      for (const categoryName of categories) {
        const categoryUuid = await getCategoryUuidFromOrderTypes(categoryName);
        if (categoryUuid && patientUUID) {
          const bundle = await getServiceRequests(
            categoryUuid,
            patientUUID,
            encounterUuids,
          );
          const items =
            bundle.entry
              ?.map((entry) => ({
                conceptCode: entry.resource?.code?.coding?.[0]?.code ?? '',
                categoryUuid: categoryUuid,
                display: entry.resource?.code?.text ?? '',
                requesterUuid:
                  entry.resource?.requester?.reference?.split('/')[1] ?? '',
              }))
              .filter((item) => item.conceptCode) ?? [];
          results.push(...items);
        }
      }
      return results;
    },
    enabled: !!patientUUID && !!currentEncounterId,
  });

  const translateOrderType = useCallback(
    (category: string): string => {
      return t(`ORDER_TYPE_${category.toUpperCase().replace(/\s/g, '_')}`, {
        defaultValue: category,
      });
    },
    [t],
  );

  const isDuplicateInvestigation = useCallback(
    (
      investigationCode: string,
      category: string,
      categoryCode: string,
    ): boolean => {
      const isExistingInvestigation = existingServiceRequests?.some(
        (sr) =>
          sr.conceptCode === investigationCode &&
          sr.categoryUuid === categoryCode &&
          sr.requesterUuid === currentPractitionerUuid,
      );

      const isSelectedInvestigation = isSelectedInCategory(
        category,
        investigationCode,
      );

      return (isExistingInvestigation ?? false) || isSelectedInvestigation;
    },
    [existingServiceRequests, isSelectedInCategory, currentPractitionerUuid],
  );

  useEffect(() => {
    if (showDuplicateNotification) {
      if (searchTerm === '') {
        setShowDuplicateNotification(false);
        setDuplicateInvestigationId(null);
        setDuplicateCategory(null);
        setDuplicateCategoryCode(null);
        return;
      }

      if (
        duplicateInvestigationId &&
        duplicateCategory &&
        duplicateCategoryCode &&
        !isDuplicateInvestigation(
          duplicateInvestigationId,
          duplicateCategory,
          duplicateCategoryCode,
        )
      ) {
        setShowDuplicateNotification(false);
        setDuplicateInvestigationId(null);
        setDuplicateCategory(null);
        setDuplicateCategoryCode(null);
      }
    }
  }, [
    searchTerm,
    selectedServiceRequests,
    showDuplicateNotification,
    duplicateInvestigationId,
    duplicateCategory,
    duplicateCategoryCode,
    isDuplicateInvestigation,
  ]);

  const arrangeFilteredInvestigationsByCategory = useCallback(
    (investigations: FlattenedInvestigations[]): FlattenedInvestigations[] => {
      let currentCategory: string | null = null;
      const investigationsByCategory: Map<string, FlattenedInvestigations[]> =
        new Map();
      for (const investigation of investigations) {
        currentCategory = investigation.category.toUpperCase();
        if (!investigationsByCategory.has(currentCategory)) {
          investigationsByCategory.set(currentCategory, []);
        }
        investigationsByCategory.get(currentCategory)?.push(investigation);
      }
      const result: FlattenedInvestigations[] = [];
      Array.from(investigationsByCategory.keys()).forEach((category) => {
        const categoryItems = investigationsByCategory.get(category) ?? [];
        result.push({
          code: '',
          display: translateOrderType(category),
          category,
          categoryCode: category,
          disabled: true,
        });
        result.push(...categoryItems);
      });
      return result;
    },
    [translateOrderType],
  );

  const filteredInvestigations: FlattenedInvestigations[] = useMemo(() => {
    if (searchTerm.length === 0) return [];
    if (isLoading) {
      return [
        {
          code: '',
          display: t('LOADING_CONCEPTS'),
          category: '',
          categoryCode: '',
          disabled: isLoading,
        },
      ];
    }
    if (error) {
      return [
        {
          code: '',
          display: t('ERROR_SEARCHING_INVESTIGATIONS', {
            error: error.message,
          }),
          category: '',
          categoryCode: '',
          disabled: true,
        },
      ];
    }
    const isSearchEmpty = investigations.length === 0;
    if (isSearchEmpty) {
      return [
        {
          code: '',
          display: t('NO_MATCHING_INVESTIGATIONS_FOUND'),
          category: '',
          categoryCode: '',
          disabled: true,
        },
      ];
    }

    const mappedItems = investigations.map((item) => {
      if (!selectedServiceRequests.has(item.category)) return item;
      const selectedItemsInCategory = selectedServiceRequests.get(
        item.category,
      );
      const isAlreadySelected =
        selectedItemsInCategory?.some(
          (selectedItem) => selectedItem.id === item.code,
        ) ?? false;
      return {
        ...item,
        display: isAlreadySelected
          ? `${item.display} ${t('INVESTIGATION_ALREADY_SELECTED')}`
          : item.display,
        disabled: isAlreadySelected,
      };
    });

    return arrangeFilteredInvestigationsByCategory(mappedItems);
  }, [
    investigations,
    searchTerm,
    isLoading,
    error,
    selectedServiceRequests,
    t,
    arrangeFilteredInvestigationsByCategory,
  ]);

  const handleChange = (
    selectedItem: FlattenedInvestigations | null | undefined,
  ) => {
    if (!selectedItem) return;

    if (
      isDuplicateInvestigation(
        selectedItem.code,
        selectedItem.category,
        selectedItem.categoryCode,
      )
    ) {
      setShowDuplicateNotification(true);
      setDuplicateInvestigationId(selectedItem.code);
      setDuplicateCategory(selectedItem.category);
      setDuplicateCategoryCode(selectedItem.categoryCode);
      return;
    }

    setShowDuplicateNotification(false);
    addServiceRequest(
      selectedItem.category,
      selectedItem.code,
      selectedItem.display,
    );
  };

  return (
    <Tile className={styles.investigationsFormTile}>
      <div className={styles.investigationsFormTitle}>
        {t('INVESTIGATIONS_FORM_TITLE')}
      </div>
      <ComboBox
        id="investigations-procedures-search"
        placeholder={t('INVESTIGATIONS_SEARCH_PLACEHOLDER')}
        items={filteredInvestigations}
        itemToString={(item) => item?.display ?? ''}
        onChange={({ selectedItem }) => handleChange(selectedItem)}
        onInputChange={(input) => setSearchTerm(input)}
        autoAlign
        aria-label={t('INVESTIGATIONS_SEARCH_ARIA_LABEL')}
        size="md"
      />
      {showDuplicateNotification && (
        <InlineNotification
          kind="error"
          lowContrast
          subtitle={t('INVESTIGATION_ALREADY_ADDED')}
          onClose={() => setShowDuplicateNotification(false)}
          hideCloseButton={false}
          className={styles.duplicateNotification}
        />
      )}

      {selectedServiceRequests &&
        selectedServiceRequests.size > 0 &&
        Array.from(selectedServiceRequests.keys()).map((category) => (
          <BoxWHeader
            key={category}
            title={t('INVESTIGATIONS_ADDED', {
              investigationType: translateOrderType(category),
            })}
            className={styles.addedInvestigationsBox}
          >
            {selectedServiceRequests.get(category)?.map((serviceRequest) => (
              <SelectedItem
                key={serviceRequest.id}
                onClose={() =>
                  removeServiceRequest(category, serviceRequest.id)
                }
                className={styles.selectedInvestigationItem}
              >
                <SelectedInvestigationItem
                  key={serviceRequest.id}
                  investigation={serviceRequest}
                  onPriorityChange={(priority) =>
                    updatePriority(category, serviceRequest.id, priority)
                  }
                  onNoteChange={(note) =>
                    updateNote(category, serviceRequest.id, note)
                  }
                />
              </SelectedItem>
            ))}
          </BoxWHeader>
        ))}
    </Tile>
  );
});

InvestigationsForm.displayName = 'InvestigationsForm';

export default InvestigationsForm;
