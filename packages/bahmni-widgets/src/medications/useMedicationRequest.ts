import {
  getPatientMedications,
  MedicationRequest,
  getFormattedError,
  useTranslation,
} from '@bahmni/services';
import { useState, useCallback, useEffect } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';

interface MedicationRequestResult {
  medications: MedicationRequest[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch and manage medications for the current patient
 * @returns Object containing medications, loading state, error state, and refetch function
 */
export const useMedicationRequest = (): MedicationRequestResult => {
  const [medications, setMedications] = useState<MedicationRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const patientUUID = usePatientUUID();
  const { t } = useTranslation();

  const fetchMedications = useCallback(async () => {
    if (!patientUUID) {
      setLoading(false);
      setMedications([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      const medicationsData = await getPatientMedications(patientUUID);
      setMedications(medicationsData);
      setError(null);
    } catch (err) {
      const formattedError = getFormattedError(err);
      const message =
        formattedError?.message || t('ERROR_FETCHING_MEDICATIONS');
      setError(err instanceof Error ? err : new Error(message));
      // Don't clear medications on error - keep previous data if available
    } finally {
      setLoading(false);
    }
  }, [patientUUID, t]);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  return {
    medications,
    loading,
    error,
    refetch: fetchMedications,
  };
};

export default useMedicationRequest;
