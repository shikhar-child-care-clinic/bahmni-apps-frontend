import { Bundle, Medication } from 'fhir/r4';
import React from 'react';

import {
  ImmunizationInputEntry,
  FieldConfig,
} from '../../../models/immunization';
import ImmunizationDetailsForm from './ImmunizationDetailsForm';
import styles from './styles/SelectedImmunizationItem.module.scss';

export interface SelectedImmunizationItemProps {
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

const SelectedImmunizationItem: React.FC<SelectedImmunizationItemProps> =
  React.memo(
    ({
      entry,
      fieldConfig,
      vaccineConceptUuid,
      vaccinationsBundle,
      routeItems,
      siteItems,
      statusReasonItems,
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
    }) => (
      <>
        <div className={styles.vaccineTitle}>
          <span data-testid={`immunization-name-${entry.id}`}>
            {entry.vaccineDisplay}
          </span>
        </div>
        <ImmunizationDetailsForm
          entry={entry}
          fieldConfig={fieldConfig}
          vaccineConceptUuid={vaccineConceptUuid}
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
      </>
    ),
  );

SelectedImmunizationItem.displayName = 'SelectedImmunizationItem';

export default SelectedImmunizationItem;
