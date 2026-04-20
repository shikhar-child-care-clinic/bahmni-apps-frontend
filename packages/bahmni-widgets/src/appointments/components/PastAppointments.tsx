import {
  getPastAppointmentsPage,
  useSubscribeConsultationSaved,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useState } from 'react';
import { useNotification } from '../../notification';
import { useFormattedAppointments } from '../hooks/useFormattedAppointments';
import type { FormattedAppointment } from '../utils';
import AppointmentTabContent from './AppointmentTabContent';

interface PastAppointmentsProps {
  patientUUID: string;
  pageSize: number;
  headers: Array<{ key: string; header: string }>;
  sortable: Array<{ key: string; sortable: boolean }>;
  renderCell: (row: FormattedAppointment, key: string) => React.ReactNode;
}

const PastAppointments: React.FC<PastAppointmentsProps> = ({
  patientUUID,
  pageSize,
  headers,
  sortable,
  renderCell,
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPageSize, setSelectedPageSize] = useState(pageSize);
  const [serverTotal, setServerTotal] = useState<number | undefined>(undefined);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['appointments-past', patientUUID, currentPage, selectedPageSize],
    enabled: !!patientUUID,
    queryFn: () =>
      getPastAppointmentsPage(patientUUID, selectedPageSize, currentPage),
  });

  const formattedAppointments = useFormattedAppointments({
    data: data?.bundle,
    idPrefix: 'past',
  });

  useEffect(() => {
    if (isError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error?.message || t('APPOINTMENTS_ERROR_FETCHING'),
        type: 'error',
      });
    }
  }, [isError, error, addNotification, t]);

  useEffect(() => {
    if (data) {
      setServerTotal(data.total);
    }
  }, [data]);

  useEffect(() => {
    setCurrentPage(1);
    setServerTotal(undefined);
  }, [patientUUID]);

  useSubscribeConsultationSaved(
    (payload) => {
      if (
        payload.patientUUID === patientUUID &&
        payload.updatedResources.conditions
      ) {
        refetch();
      }
    },
    [patientUUID, refetch],
  );

  const handlePageChange = useCallback(
    (newPage: number, newPageSize: number) => {
      if (newPageSize !== selectedPageSize) {
        setSelectedPageSize(newPageSize);
        setCurrentPage(1);
        setServerTotal(undefined);
      } else {
        setCurrentPage(newPage);
      }
    },
    [selectedPageSize],
  );

  return (
    <AppointmentTabContent
      appointments={formattedAppointments}
      isLoading={isLoading}
      emptyMessageKey="DASHBOARD_NO_PAST_APPOINTMENTS_KEY"
      headers={headers}
      sortable={sortable}
      renderCell={renderCell}
      pageSize={selectedPageSize}
      page={currentPage}
      totalItems={serverTotal}
      onPageChange={handlePageChange}
    />
  );
};

export default PastAppointments;
