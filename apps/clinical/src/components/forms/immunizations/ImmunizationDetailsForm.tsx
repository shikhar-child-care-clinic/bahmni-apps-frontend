import {
  Column,
  Grid,
  ComboBox,
  Dropdown,
  NumberInput,
  DatePicker,
  DatePickerInput,
  TextInput,
  Link,
  TextAreaWClose,
} from '@bahmni/design-system';
import { useTranslation, getTodayDate } from '@bahmni/services';
import { Bundle, Medication } from 'fhir/r4';
import React, { useMemo, useState } from 'react';

import { useLocations } from '../../../hooks/useLocations';
import {
  ImmunizationInputEntry,
  FieldConfig,
  FieldConfigKey,
} from '../../../models/immunization';
import { getMedicationDisplay } from '../../../services/medicationService';
import {
  isFieldVisible,
  isFieldRequired,
  isFieldReadonly,
} from '../../../utils/immunizationFieldConfig';
import styles from './styles/SelectedImmunizationItem.module.scss';

export interface ImmunizationDetailsFormProps {
  entry: ImmunizationInputEntry;
  fieldConfig: FieldConfig;
  vaccineConceptUuid: string;
  vaccinationsBundle: Bundle<Medication>;
  routeItems: { uuid: string; name: string }[];
  siteItems: { uuid: string; name: string }[];
  statusReasonItems?: { uuid: string; name: string }[];

  updateDoseSequence: (id: string, value: number | null) => void;
  updateDrug: (
    id: string,
    drugUuid: string | null,
    drugDisplay: string | null,
  ) => void;
  updateDrugNonCoded: (id: string, value: string) => void;
  updateAdministeredOn: (id: string, date: Date | null) => void;
  updateLocation: (
    id: string,
    uuid: string | null,
    display: string | null,
  ) => void;
  updateLocationText: (id: string, value: string) => void;
  updateRoute: (
    id: string,
    uuid: string | null,
    display: string | null,
  ) => void;
  updateSite: (id: string, uuid: string | null, display: string | null) => void;
  updateManufacturer: (id: string, value: string) => void;
  updateBatchNumber: (id: string, value: string) => void;
  updateExpirationDate: (id: string, date: Date | null) => void;
  updateNotes: (id: string, value: string) => void;
  updateStatusReason?: (
    id: string,
    uuid: string | null,
    display: string | null,
  ) => void;
}

// Sentinel value used to identify the "Enter manually" option in ComboBox lists
const ENTER_MANUALLY = '__ENTER_MANUALLY__' as const;

const renderRequiredLabel = (label: string, required: boolean) =>
  required ? (
    <span>
      {label}
      <span className={styles.requiredMark}> *</span>
    </span>
  ) : (
    label
  );

const ImmunizationDetailsForm: React.FC<ImmunizationDetailsFormProps> =
  React.memo(
    ({
      entry,
      fieldConfig,
      vaccineConceptUuid,
      vaccinationsBundle,
      routeItems,
      siteItems,
      statusReasonItems = [],
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
    }) => {
      const { t } = useTranslation();
      const { locations } = useLocations();
      const [hasNote, setHasNote] = useState(!!entry.notes);
      const [drugSearchTerm, setDrugSearchTerm] = useState('');
      const [locationSearchTerm, setLocationSearchTerm] = useState('');
      const [isDrugManual, setIsDrugManual] = useState(!!entry.drugNonCoded);
      const [isLocationManual, setIsLocationManual] = useState(
        !!entry.locationText,
      );

      const {
        id,
        doseSequence,
        drugUuid,
        drugDisplay,
        drugNonCoded,
        administeredOn,
        expirationDate,
        locationUuid,
        locationText,
        manufacturer,
        batchNumber,
        notes,
        errors,
      } = entry;

      const show = (field: FieldConfigKey) =>
        isFieldVisible(fieldConfig, field);
      const required = (field: FieldConfigKey) =>
        isFieldRequired(fieldConfig, field);
      const readonly = (field: FieldConfigKey) =>
        isFieldReadonly(fieldConfig, field);

      const enterManuallyOption = useMemo(
        () => ({
          displayName: t('IMMUNIZATION_ENTER_MANUALLY'),
          id: ENTER_MANUALLY,
          disabled: false,
        }),
        [t],
      );

      const filteredDrugs = useMemo(() => {
        if (!vaccinationsBundle?.entry) return [enterManuallyOption];

        const allMedications = vaccinationsBundle.entry
          .map((e) => e.resource)
          .filter((r): r is Medication => !!r);

        const vaccineCodeDrugs = allMedications.filter((med) =>
          (med.code?.coding ?? []).some(
            (coding) =>
              coding.code === vaccineConceptUuid ||
              coding.display
                ?.toLowerCase()
                .includes(entry.vaccineDisplay.toLowerCase()),
          ),
        );

        const drugsToFilter =
          vaccineCodeDrugs.length > 0 ? vaccineCodeDrugs : allMedications;

        const filtered =
          drugSearchTerm.trim() === ''
            ? drugsToFilter
            : drugsToFilter.filter((med) =>
                getMedicationDisplay(med)
                  .toLowerCase()
                  .includes(drugSearchTerm.toLowerCase()),
              );

        return [
          ...filtered.map((med) => ({
            medication: med,
            displayName: getMedicationDisplay(med),
            id: med.id ?? '',
            disabled: false,
          })),
          enterManuallyOption,
        ];
      }, [
        vaccinationsBundle,
        vaccineConceptUuid,
        entry.vaccineDisplay,
        drugSearchTerm,
        enterManuallyOption,
      ]);

      const locationItems = useMemo(
        () => locations.map((loc) => ({ uuid: loc.uuid, name: loc.display })),
        [locations],
      );

      const filteredLocations = useMemo(() => {
        const enterManuallyLocationOption = {
          uuid: ENTER_MANUALLY,
          name: t('IMMUNIZATION_ENTER_MANUALLY'),
        };

        const filtered =
          locationSearchTerm.trim() === ''
            ? locationItems
            : locationItems.filter((loc) =>
                loc.name
                  .toLowerCase()
                  .includes(locationSearchTerm.toLowerCase()),
              );

        return [...filtered, enterManuallyLocationOption];
      }, [locationItems, locationSearchTerm, t]);

      const selectedDrug = useMemo(
        () =>
          drugDisplay
            ? { displayName: drugDisplay, id: drugUuid ?? '', disabled: false }
            : null,
        [drugUuid, drugDisplay],
      );

      const selectedLocation = useMemo(
        () =>
          locationUuid
            ? (locationItems.find((l) => l.uuid === locationUuid) ?? null)
            : null,
        [locationUuid, locationItems],
      );

      const showNotes = show('notes');

      return (
        <>
          <Grid narrow data-testid={`immunization-fields-form-grid-${id}`}>
            {show('statusReason') && (
              <Column sm={4} md={4} lg={5}>
                <Dropdown
                  id={`status-reason-${id}`}
                  data-testid={`immunization-status-reason-${id}`}
                  titleText={renderRequiredLabel(
                    t('IMMUNIZATION_STATUS_REASON'),
                    required('statusReason'),
                  )}
                  label={t('IMMUNIZATION_STATUS_REASON')}
                  size="sm"
                  items={statusReasonItems}
                  itemToString={(item: { name: string } | null) =>
                    item ? item.name : ''
                  }
                  selectedItem={
                    entry.statusReasonConceptUuid
                      ? (statusReasonItems.find(
                          (r) => r.uuid === entry.statusReasonConceptUuid,
                        ) ?? null)
                      : null
                  }
                  onChange={(e: {
                    selectedItem: { uuid: string; name: string } | null;
                  }) => {
                    if (e.selectedItem && updateStatusReason)
                      updateStatusReason(
                        id,
                        e.selectedItem.uuid,
                        e.selectedItem.name,
                      );
                  }}
                  autoAlign
                  invalid={!!errors.statusReason}
                  invalidText={t(errors.statusReason ?? '')}
                />
              </Column>
            )}
            {show('administeredOn') && (
              <Column
                sm={4}
                md={4}
                lg={5}
                className={styles.datePickerFullWidth}
              >
                <DatePicker
                  datePickerType="single"
                  data-testid={`immunization-date-picker-${id}`}
                  value={administeredOn ?? undefined}
                  maxDate={getTodayDate()}
                  onChange={(date: Date[]) => {
                    if (date?.[0]) updateAdministeredOn(id, date[0]);
                  }}
                >
                  <DatePickerInput
                    id={`administered-on-${id}`}
                    data-testid={`immunization-date-input-${id}`}
                    labelText={renderRequiredLabel(
                      t('IMMUNIZATION_ADMINISTERED_ON'),
                      required('administeredOn'),
                    )}
                    size="sm"
                    invalid={!!errors.administeredOn}
                    invalidText={t(errors.administeredOn ?? '')}
                    disabled={readonly('administeredOn')}
                  />
                </DatePicker>
              </Column>
            )}
            {show('location') && (
              <Column sm={4} md={4} lg={5}>
                {isLocationManual ? (
                  <>
                    <TextInput
                      id={`location-text-${id}`}
                      data-testid={`immunization-location-text-${id}`}
                      labelText={renderRequiredLabel(
                        t('IMMUNIZATION_ADMINISTERED_LOCATION'),
                        required('location'),
                      )}
                      placeholder={t('IMMUNIZATION_ADMINISTERED_LOCATION')}
                      size="sm"
                      value={locationText}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateLocationText(id, e.target.value)
                      }
                      disabled={readonly('location')}
                      invalid={!!errors.location}
                      invalidText={t(errors.location ?? '')}
                    />
                    {!readonly('location') && (
                      <Link
                        href="#"
                        data-testid={`immunization-location-back-to-list-${id}`}
                        onClick={(e: React.MouseEvent) => {
                          e.preventDefault();
                          setIsLocationManual(false);
                          updateLocationText(id, '');
                        }}
                      >
                        {t('IMMUNIZATION_BACK_TO_LIST')}
                      </Link>
                    )}
                  </>
                ) : (
                  <ComboBox
                    id={`location-${id}`}
                    data-testid={`immunization-location-${id}`}
                    placeholder={t('IMMUNIZATION_ADMINISTERED_LOCATION')}
                    titleText={renderRequiredLabel(
                      t('IMMUNIZATION_ADMINISTERED_LOCATION'),
                      required('location'),
                    )}
                    items={filteredLocations}
                    itemToString={(item: { name: string } | null) =>
                      item ? item.name : ''
                    }
                    onChange={(e: {
                      selectedItem: { uuid: string; name: string } | null;
                    }) => {
                      if (!e.selectedItem) {
                        updateLocation(id, null, null);
                      } else if (e.selectedItem.uuid === ENTER_MANUALLY) {
                        setIsLocationManual(true);
                        updateLocation(id, null, null);
                      } else {
                        updateLocation(
                          id,
                          e.selectedItem.uuid,
                          e.selectedItem.name,
                        );
                      }
                    }}
                    onInputChange={(query: string) =>
                      setLocationSearchTerm(query)
                    }
                    selectedItem={selectedLocation}
                    size="sm"
                    autoAlign
                    disabled={readonly('location')}
                    invalid={!!errors.location}
                    invalidText={t(errors.location ?? '')}
                  />
                )}
              </Column>
            )}
            {show('doseSequence') && (
              <Column sm={4} md={4} lg={5}>
                <NumberInput
                  id={`dose-sequence-${id}`}
                  data-testid={`immunization-dose-sequence-${id}`}
                  label={renderRequiredLabel(
                    t('IMMUNIZATION_DOSE_SEQUENCE'),
                    required('doseSequence'),
                  )}
                  min={0}
                  size="sm"
                  step={1}
                  value={doseSequence ?? ''}
                  allowEmpty
                  onChange={(_: unknown, { value }: { value: string }) => {
                    const num = parseInt(value, 10);
                    updateDoseSequence(id, isNaN(num) || num <= 0 ? null : num);
                  }}
                  disabled={readonly('doseSequence')}
                  invalid={!!errors.doseSequence}
                  invalidText={t(errors.doseSequence ?? '')}
                />
              </Column>
            )}
            {show('drug') && (
              <Column sm={4} md={4} lg={5}>
                {isDrugManual ? (
                  <>
                    <TextInput
                      id={`drug-non-coded-${id}`}
                      data-testid={`immunization-drug-non-coded-${id}`}
                      labelText={renderRequiredLabel(
                        t('IMMUNIZATION_DRUG_NAME'),
                        required('drug'),
                      )}
                      placeholder={t('IMMUNIZATION_DRUG_NAME')}
                      size="sm"
                      value={drugNonCoded}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateDrugNonCoded(id, e.target.value)
                      }
                      disabled={readonly('drug')}
                      invalid={!!errors.drug}
                      invalidText={t(errors.drug ?? '')}
                    />
                    {!readonly('drug') && (
                      <Link
                        href="#"
                        data-testid={`immunization-drug-back-to-list-${id}`}
                        onClick={(e: React.MouseEvent) => {
                          e.preventDefault();
                          setIsDrugManual(false);
                          updateDrugNonCoded(id, '');
                        }}
                      >
                        {t('IMMUNIZATION_BACK_TO_LIST')}
                      </Link>
                    )}
                  </>
                ) : (
                  <ComboBox
                    id={`drug-search-${id}`}
                    data-testid={`immunization-drug-search-${id}`}
                    placeholder={t('IMMUNIZATION_DRUG_SEARCH_PLACEHOLDER')}
                    titleText={renderRequiredLabel(
                      t('IMMUNIZATION_DRUG_NAME'),
                      required('drug'),
                    )}
                    items={filteredDrugs}
                    itemToString={(item: { displayName: string } | null) =>
                      item ? item.displayName : ''
                    }
                    onChange={(data: {
                      selectedItem: {
                        id: string;
                        medication?: Medication;
                        displayName: string;
                      } | null;
                    }) => {
                      if (!data.selectedItem) {
                        updateDrug(id, null, null);
                      } else if (data.selectedItem.id === ENTER_MANUALLY) {
                        setIsDrugManual(true);
                        updateDrug(id, null, null);
                      } else {
                        updateDrug(
                          id,
                          data.selectedItem.medication?.id ?? null,
                          data.selectedItem.displayName,
                        );
                      }
                    }}
                    onInputChange={(query: string) => setDrugSearchTerm(query)}
                    selectedItem={selectedDrug}
                    size="sm"
                    autoAlign
                    disabled={readonly('drug')}
                    invalid={!!errors.drug}
                    invalidText={t(errors.drug ?? '')}
                  />
                )}
              </Column>
            )}
            {show('site') && (
              <Column sm={4} md={4} lg={5}>
                <Dropdown
                  id={`site-${id}`}
                  data-testid={`immunization-site-${id}`}
                  titleText={renderRequiredLabel(
                    t('IMMUNIZATION_SITE'),
                    required('site'),
                  )}
                  label={t('IMMUNIZATION_SITE')}
                  size="sm"
                  items={siteItems}
                  itemToString={(item: { name: string } | null) =>
                    item ? item.name : ''
                  }
                  selectedItem={
                    entry.siteConceptUuid
                      ? (siteItems.find(
                          (s) => s.uuid === entry.siteConceptUuid,
                        ) ?? null)
                      : null
                  }
                  onChange={(e: {
                    selectedItem: { uuid: string; name: string } | null;
                  }) => {
                    if (e.selectedItem)
                      updateSite(id, e.selectedItem.uuid, e.selectedItem.name);
                  }}
                  autoAlign
                  disabled={readonly('site')}
                  invalid={!!errors.site}
                  invalidText={t(errors.site ?? '')}
                />
              </Column>
            )}
            {show('route') && (
              <Column sm={4} md={4} lg={5}>
                <Dropdown
                  id={`route-${id}`}
                  data-testid={`immunization-route-${id}`}
                  titleText={renderRequiredLabel(
                    t('IMMUNIZATION_ROUTE'),
                    required('route'),
                  )}
                  label={t('IMMUNIZATION_ROUTE')}
                  size="sm"
                  items={routeItems}
                  itemToString={(item: { name: string } | null) =>
                    item ? item.name : ''
                  }
                  selectedItem={
                    entry.routeConceptUuid
                      ? (routeItems.find(
                          (r) => r.uuid === entry.routeConceptUuid,
                        ) ?? null)
                      : null
                  }
                  onChange={(e: {
                    selectedItem: { uuid: string; name: string } | null;
                  }) => {
                    if (e.selectedItem)
                      updateRoute(id, e.selectedItem.uuid, e.selectedItem.name);
                  }}
                  autoAlign
                  disabled={readonly('route')}
                  invalid={!!errors.route}
                  invalidText={t(errors.route ?? '')}
                />
              </Column>
            )}
            {show('manufacturer') && (
              <Column sm={4} md={4} lg={5}>
                <TextInput
                  id={`manufacturer-${id}`}
                  data-testid={`immunization-manufacturer-${id}`}
                  labelText={renderRequiredLabel(
                    t('IMMUNIZATION_MANUFACTURER'),
                    required('manufacturer'),
                  )}
                  placeholder={t('IMMUNIZATION_MANUFACTURER')}
                  size="sm"
                  value={manufacturer}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateManufacturer(id, e.target.value)
                  }
                  disabled={readonly('manufacturer')}
                  invalid={!!errors.manufacturer}
                  invalidText={t(errors.manufacturer ?? '')}
                />
              </Column>
            )}
            {show('batchNumber') && (
              <Column sm={4} md={4} lg={5}>
                <TextInput
                  id={`batch-number-${id}`}
                  data-testid={`immunization-batch-number-${id}`}
                  labelText={renderRequiredLabel(
                    t('IMMUNIZATION_BATCH_NUMBER'),
                    required('batchNumber'),
                  )}
                  placeholder={t('IMMUNIZATION_BATCH_NUMBER')}
                  size="sm"
                  value={batchNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateBatchNumber(id, e.target.value)
                  }
                  disabled={readonly('batchNumber')}
                  invalid={!!errors.batchNumber}
                  invalidText={t(errors.batchNumber ?? '')}
                />
              </Column>
            )}
            {show('expirationDate') && (
              <Column
                sm={4}
                md={4}
                lg={5}
                className={styles.datePickerFullWidth}
              >
                <DatePicker
                  datePickerType="single"
                  data-testid={`immunization-expiry-picker-${id}`}
                  value={expirationDate ?? undefined}
                  onChange={(date: Date[]) => {
                    updateExpirationDate(id, date?.[0] ?? null);
                  }}
                >
                  <DatePickerInput
                    id={`expiration-date-${id}`}
                    data-testid={`immunization-expiry-input-${id}`}
                    labelText={renderRequiredLabel(
                      t('IMMUNIZATION_EXPIRY_DATE'),
                      required('expirationDate'),
                    )}
                    size="sm"
                    disabled={readonly('expirationDate')}
                    invalid={!!errors.expirationDate}
                    invalidText={t(errors.expirationDate ?? '')}
                  />
                </DatePicker>
              </Column>
            )}
          </Grid>
          {showNotes && (
            <div>
              {!hasNote && (
                <Link
                  href="#"
                  data-testid={`immunization-add-note-link-${id}`}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    setHasNote(true);
                  }}
                >
                  {t('IMMUNIZATION_ADD_NOTE')}
                </Link>
              )}
            </div>
          )}
          {showNotes && hasNote && (
            <TextAreaWClose
              id={`immunization-note-${id}`}
              data-testid={`immunization-note-${id}`}
              labelText={t('IMMUNIZATION_ADD_NOTE')}
              placeholder={t('IMMUNIZATION_ADD_NOTE_PLACEHOLDER')}
              value={notes}
              onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                updateNotes(id, event.target.value)
              }
              onClose={() => {
                setHasNote(false);
                updateNotes(id, '');
              }}
              enableCounter
              maxCount={1024}
            />
          )}
        </>
      );
    },
  );

ImmunizationDetailsForm.displayName = 'ImmunizationDetailsForm';

export default ImmunizationDetailsForm;
