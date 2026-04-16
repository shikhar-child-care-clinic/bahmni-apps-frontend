import {
  Stethoscope,
  Image,
  Document,
  Calendar,
  Hospital,
  HospitalBed,
  Settings,
  List,
  Notification,
  Microscope,
  ReportData,
  Terminal,
  ArrowRight,
  UserFilled,
} from '@carbon/icons-react';
import React from 'react';
import { BAHMNI_ICON_NAMES, BahmniIconName } from './constants';

export const bahmniIconRegistry: Record<BahmniIconName, React.ComponentType> = {
  [BAHMNI_ICON_NAMES.REGISTRATION]: UserFilled,
  [BAHMNI_ICON_NAMES.CLINICAL]: Stethoscope,
  [BAHMNI_ICON_NAMES.PROGRAMS]: List,
  [BAHMNI_ICON_NAMES.RADIOLOGY]: Image,
  [BAHMNI_ICON_NAMES.PATIENT_DOCUMENTS]: Document,
  [BAHMNI_ICON_NAMES.BED_MANAGEMENT]: HospitalBed,
  [BAHMNI_ICON_NAMES.ADMIN]: Settings,
  [BAHMNI_ICON_NAMES.REPORTS]: ReportData,
  [BAHMNI_ICON_NAMES.OPERATION_THEATRE]: Hospital,
  [BAHMNI_ICON_NAMES.ORDERS]: List,
  [BAHMNI_ICON_NAMES.IMPLEMENTER_INTERFACE]: Terminal,
  [BAHMNI_ICON_NAMES.ATOMFEED_CONSOLE]: Notification,
  [BAHMNI_ICON_NAMES.APPOINTMENT_SCHEDULING]: Calendar,
  [BAHMNI_ICON_NAMES.LAB_LITE]: Microscope,
  [BAHMNI_ICON_NAMES.NAVIGATION]: ArrowRight,
};

/**
 * Retrieves an icon component by name from the registry
 * @param iconName - The name of the icon to retrieve
 * @returns The Carbon icon component, or null if not found
 */
export const getIcon = (iconName: string): React.ComponentType | null => {
  if (!iconName || typeof iconName !== 'string') {
    return null;
  }
  const icon = (bahmniIconRegistry as Record<string, React.ComponentType>)[
    iconName
  ];
  return icon ?? null;
};

/**
 * Checks if an icon name exists in the registry
 * @param iconName - The name of the icon to check
 * @returns true if the icon exists, false otherwise
 */
export const isValidIconName = (
  iconName: string,
): iconName is BahmniIconName => {
  return iconName in bahmniIconRegistry;
};
