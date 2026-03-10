import { ActionDataTable, BaseLayout, Header } from '@bahmni/design-system';
import {
  AppointmentService,
  BAHMNI_HOME_PATH,
  getAllAppointmentServices,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { KNOWN_FIELDS } from './constants';
import styles from './styles/index.module.scss';

type ServiceRow = AppointmentService & { id: string };

const AllServicesPage: React.FC = () => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['allAppointmentServices'],
    queryFn: getAllAppointmentServices,
  });

  const headers = [
    {
      key: KNOWN_FIELDS.NAME,
      header: t('ADMIN_ALL_SERVICES_COLUMN_SERVICE_NAME'),
    },
    {
      key: KNOWN_FIELDS.LOCATION,
      header: t('ADMIN_ALL_SERVICES_COLUMN_LOCATION'),
    },
    {
      key: KNOWN_FIELDS.SPECIALITY,
      header: t('ADMIN_ALL_SERVICES_COLUMN_SPECIALITY'),
    },
    {
      key: KNOWN_FIELDS.DURATION_MINS,
      header: t('ADMIN_ALL_SERVICES_COLUMN_DURATION'),
    },
    {
      key: KNOWN_FIELDS.DESCRIPTION,
      header: t('ADMIN_ALL_SERVICES_COLUMN_DESCRIPTION'),
    },
    {
      key: KNOWN_FIELDS.ACTIONS,
      header: t('ADMIN_ALL_SERVICES_COLUMN_ACTIONS'),
    },
  ];

  const rows: ServiceRow[] = (data ?? []).map((service) => ({
    ...service,
    id: service.uuid,
  }));

  const renderCell = (row: ServiceRow, cellId: string): React.ReactNode => {
    switch (cellId) {
      case KNOWN_FIELDS.LOCATION:
        return row.location?.name ?? '-';
      case KNOWN_FIELDS.SPECIALITY:
        return row.speciality?.name ?? '-';
      case KNOWN_FIELDS.DURATION_MINS:
        return row.durationMins ?? '-';
      case KNOWN_FIELDS.DESCRIPTION:
        return row.description ?? '-';
      case KNOWN_FIELDS.ACTIONS:
        return null;
      default:
        return String(row[cellId as keyof ServiceRow] ?? '-');
    }
  };

  const breadcrumbs = [
    { id: 'home', label: t('BREADCRUMB_HOME'), href: BAHMNI_HOME_PATH },
    { id: 'admin', label: t('BREADCRUMB_ADMIN'), isCurrentPage: true },
  ];

  return (
    <BaseLayout
      header={<Header breadcrumbItems={breadcrumbs} />}
      main={
        <div className={styles.tableContainer}>
          <ActionDataTable
            id="all-services"
            title={t('ADMIN_ALL_SERVICES_TITLE')}
            headers={headers}
            rows={rows}
            ariaLabel="all-services-table"
            loading={isLoading}
            errorStateMessage={
              isError ? t('ADMIN_ALL_SERVICES_ERROR_MESSAGE') : null
            }
            emptyStateMessage={t('ADMIN_ALL_SERVICES_EMPTY_MESSAGE')}
            renderCell={renderCell}
            className={styles.table}
          />
        </div>
      }
    />
  );
};

export default AllServicesPage;
