import {
  SortableDataTable,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@bahmni/design-system';
import {
  useTranslation,
  useSubscribeConsultationSaved,
  ConsultationSavedEventPayload,
  getUpcomingAppointments,
  getPastAppointments,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetProps } from '../registry/model';
import styles from './styles/AppointmentsTable.module.scss';
import { formatAppointment, FormattedAppointment } from './utils';

// Field name to translation key mapping
const FIELD_TRANSLATION_MAP: Record<string, string> = {
  appointmentNumber: 'APPOINTMENTS_NUMBER',
  service: 'APPOINTMENTS_SERVICE',
  reason: 'APPOINTMENTS_REASON',
  appointmentDate: 'APPOINTMENTS_DATE',
  appointmentSlot: 'APPOINTMENTS_SLOT',
  status: 'APPOINTMENTS_STATUS',
  provider: 'APPOINTMENTS_PROVIDER',
};

// Default fields to display in the table
const DEFAULT_FIELDS = [
  'appointmentNumber',
  'service',
  'reason',
  'appointmentDate',
  'appointmentSlot',
  'status',
  'provider',
];

// Helper function to get appointment status CSS class
const getAppointmentStatusClassName = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'scheduled':
    case 'confirmed':
      return styles.scheduledStatus;
    case 'completed':
      return styles.completedStatus;
    case 'cancelled':
      return styles.cancelledStatus;
    case 'missed':
      return styles.missedStatus;
    case 'waitlist':
      return styles.waitListStatus;
    case 'checkedin':
      return styles.checkedInStatus;
    default:
      return styles.unknownStatus;
  }
};

// Helper function to get translation key for appointment status
const getAppointmentStatusKey = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'scheduled':
    case 'confirmed':
      return 'APPOINTMENTS_STATUS_SCHEDULED';
    case 'completed':
      return 'APPOINTMENTS_STATUS_COMPLETED';
    case 'cancelled':
      return 'APPOINTMENTS_STATUS_CANCELLED';
    case 'missed':
      return 'APPOINTMENTS_STATUS_MISSED';
    case 'waitlist':
      return 'APPOINTMENTS_STATUS_WAITLIST';
    case 'checkedin':
      return 'APPOINTMENTS_STATUS_CHECKEDIN';
    default:
      return 'APPOINTMENTS_STATUS_UNKNOWN';
  }
};

const AppointmentsTable: React.FC<WidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const { addNotification } = useNotification();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Fetch upcoming appointments using TanStack Query
  const {
    data: upcomingData,
    isLoading: upcomingLoading,
    isError: upcomingError,
    error: upcomingErrorObj,
    refetch: refetchUpcoming,
  } = useQuery({
    queryKey: ['appointments-upcoming', patientUUID!],
    enabled: !!patientUUID,
    queryFn: () => getUpcomingAppointments(patientUUID!),
  });

  // Fetch past appointments using TanStack Query
  const {
    data: pastData,
    isLoading: pastLoading,
    isError: pastError,
    error: pastErrorObj,
    refetch: refetchPast,
  } = useQuery({
    queryKey: ['appointments-past', patientUUID!],
    enabled: !!patientUUID,
    queryFn: () => getPastAppointments(patientUUID!),
  });

  // Handle errors with notifications
  useEffect(() => {
    if (upcomingError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: upcomingErrorObj?.message || t('APPOINTMENTS_ERROR_FETCHING'),
        type: 'error',
      });
    }
  }, [upcomingError, upcomingErrorObj, addNotification, t]);

  useEffect(() => {
    if (pastError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: pastErrorObj?.message || t('APPOINTMENTS_ERROR_FETCHING'),
        type: 'error',
      });
    }
  }, [pastError, pastErrorObj, addNotification, t]);

  // Subscribe to consultation saved events and refetch if appointments were updated
  useSubscribeConsultationSaved(
    (payload: ConsultationSavedEventPayload) => {
      if (payload.patientUUID === patientUUID) {
        // Refetch both appointment lists when consultation is saved
        refetchUpcoming();
        refetchPast();
      }
    },
    [patientUUID, refetchUpcoming, refetchPast],
  );

  const upcomingAppointments = upcomingData ?? [];

  // Limit past appointments to the configured number
  const pastAppointmentsData = pastData ?? [];
  const numberOfPastAppointments =
    config?.numberOfPastAppointments ?? pastAppointmentsData.length;
  const pastAppointments =
    numberOfPastAppointments > 0
      ? pastAppointmentsData.slice(0, numberOfPastAppointments)
      : [];

  const handleTabChange = (selectedIndex: number) => {
    setSelectedIndex(selectedIndex);
  };

  // Get configured fields from config, or use default if not provided
  const configuredFields = config?.fields ?? DEFAULT_FIELDS;

  // Table headers - built from config fields
  const headers = useMemo(
    () =>
      configuredFields.map((fieldKey: string) => ({
        key: fieldKey,
        header: t(FIELD_TRANSLATION_MAP[fieldKey] || fieldKey),
      })),
    [configuredFields, t],
  );

  const sortable = useMemo(
    () =>
      configuredFields.map((fieldKey: string) => ({
        key: fieldKey,
        sortable: true,
      })),
    [configuredFields],
  );

  // Format upcoming appointments for display
  const formattedUpcomingAppointments = useMemo(() => {
    if (!upcomingAppointments) return [];
    return upcomingAppointments.map((appointment, index: number) => {
      // Service has already transformed SQL response to Appointment format
      // Add a generated uuid if API didn't provide one
      appointment.uuid ??= `upcoming-${index}`;
      // Format for display (handles date/time formatting)
      return formatAppointment(appointment);
    });
  }, [upcomingAppointments]);

  // Format past appointments for display
  const formattedPastAppointments = useMemo(() => {
    if (!pastAppointments || pastAppointments.length === 0) {
      return [];
    }
    const formatted = pastAppointments
      .map((appointment, index: number) => {
        if (!appointment) {
          return undefined;
        }
        // Service has already transformed SQL response to Appointment format
        // Add a generated uuid if API didn't provide one
        appointment.uuid ??= `past-${index}`;
        // Format for display (handles date/time formatting)
        return formatAppointment(appointment);
      })
      .filter((item): item is FormattedAppointment => item !== undefined);
    return formatted;
  }, [pastAppointments]);

  // Custom cell renderer for table cells
  const renderCell = useCallback(
    (row: FormattedAppointment, key: string) => {
      // Safety check for undefined row
      if (!row) {
        return '-';
      }

      const record = row as unknown as Record<string, unknown>;
      switch (key) {
        case 'appointmentNumber': {
          const appointmentNum = (
            record.appointmentNumber as string | undefined
          )?.trim();
          return appointmentNum ?? '-';
        }
        case 'service':
          return row.service?.name?.trim() ? (
            <p className={styles.columnDataBold}>{row.service.name}</p>
          ) : (
            '-'
          );
        case 'reason': {
          const reasonVal = (record.reason as string | undefined)?.trim();
          return reasonVal ?? '-';
        }
        case 'appointmentDate': {
          // Date is already formatted as DD/MM/YYYY
          const dateVal = row.appointmentDate?.trim();
          return dateVal ?? '-';
        }
        case 'appointmentSlot': {
          // Slot/Time range from SQL (e.g., "11:30 PM - 11:46 PM")
          const timeVal = row.appointmentTime?.trim();
          return timeVal ?? '-';
        }
        case 'status':
          return (
            <div
              className={`${styles.statusChip} ${getAppointmentStatusClassName(row.status)}`}
              data-testid={`appointment-status-${row.uuid}`}
            >
              {t(getAppointmentStatusKey(row.status))}
            </div>
          );
        case 'provider': {
          const providerName = row.provider?.name?.trim();

          return providerName?.length ? providerName : '-';
        }
        default:
          return null;
      }
    },
    [t],
  );

  const hasError = upcomingError || pastError;

  if (hasError) {
    return (
      <div data-testid="appointments-table-error">
        <p className={styles.appointmentTableEmpty}>
          {t('APPOINTMENTS_ERROR_FETCHING')}
        </p>
      </div>
    );
  }

  return (
    <div data-testid="appointments-table">
      <Tabs
        selectedIndex={selectedIndex}
        onChange={(state) => handleTabChange(state.selectedIndex)}
      >
        <TabList
          aria-label={t('APPOINTMENTS_TABLE_ARIA_LABEL')}
          className={styles.appointmentTabList}
        >
          <Tab tabIndex={0}>{t('APPOINTMENTS_TAB_UPCOMING')}</Tab>
          <Tab tabIndex={1}>{t('APPOINTMENTS_TAB_PAST')}</Tab>
        </TabList>
        <TabPanels>
          {/* Tab 1: Upcoming Appointments (from SQL endpoint - already filtered) */}
          <TabPanel className={styles.appointmentTabs}>
            {formattedUpcomingAppointments.length > 0 ? (
              <SortableDataTable
                headers={headers}
                ariaLabel={t('APPOINTMENTS_TABLE_ARIA_LABEL')}
                rows={
                  formattedUpcomingAppointments as unknown as Array<
                    Record<string, unknown>
                  >
                }
                loading={upcomingLoading}
                sortable={sortable}
                renderCell={renderCell}
                className={styles.appointmentsTableBody}
              />
            ) : (
              <p className={styles.appointmentTableEmpty}>
                {t('DASHBOARD_NO_UPCOMING_APPOINTMENTS_KEY')}
              </p>
            )}
          </TabPanel>

          {/* Tab 2: Past Appointments (simple table view, same as upcoming) */}
          <TabPanel className={styles.appointmentTabs}>
            {formattedPastAppointments.length > 0 ? (
              <SortableDataTable
                headers={headers}
                ariaLabel={t('APPOINTMENTS_TABLE_ARIA_LABEL')}
                rows={
                  formattedPastAppointments as unknown as Array<
                    Record<string, unknown>
                  >
                }
                loading={pastLoading}
                sortable={sortable}
                renderCell={renderCell}
                className={styles.appointmentsTableBody}
              />
            ) : (
              <p className={styles.appointmentTableEmpty}>
                {t('DASHBOARD_NO_PAST_APPOINTMENTS_KEY')}
              </p>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
};

export default AppointmentsTable;
